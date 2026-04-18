# GPU cluster operations

到這邊你已經看過一張 GPU 在做 LLM serving 時會做什麼,也看過哪些框架在驅動它。這一章是關於*一整群*GPU 的穩定運行 —— scheduling、scaling、observing、recovering。這些做法跟無狀態 web serving 差得夠多,你原本的反射動作有一些要調整。

## Kubernetes 和 GPU

Kubernetes 目前是 LLM fleet 營運的 default。要在它裡面讓 GPU 動起來,需要三塊:

1. **NVIDIA GPU Operator。** 在每個 node 上裝 driver、CUDA runtime、監控工具。一次性的 cluster 設定。
2. **Device plugin。** 把 GPU 宣告成可排程資源(`nvidia.com/gpu`),讓 pod 可以申請。
3. **Node label 和 taint。** 標記哪些 node 有哪種 GPU;在 GPU node 上加 taint,讓只有 GPU workload 會被排到那上面。

一個 pod 申請 GPU 長這樣:

```yaml
resources:
  limits:
    nvidia.com/gpu: 1
```

GPU 預設是不可分割的 —— 一個 pod 要 1,就拿到整張,即使它只用了 10%。這是對「習慣用分數 CPU 申請」的人最大的驚訝點。

## MIG:不可分割的例外

在 A100、H100、H200 上,**Multi-Instance GPU(MIG)** 能把單張 GPU 切成最多 7 張較小的、彼此隔離的 GPU,而且是硬體強制的 compute 和記憶體配額。每個 partition 在 scheduler 眼中看起來就是一張比較小的 GPU。

- **有用的情況:** 在一張大 GPU 上跑很多小 model、多租戶要隔離、或給開發者便宜的 per-slice GPU 用。
- **不適合的情況:** 動態 workload(重新配置 MIG 分區要 reboot)、serve 大 model(分區之間沒有 NVLink)。

對大 model 的 LLM serving,MIG 通常不是對的工具。對「多個小 model 混合推論 workload」則是很棒。

## Scheduling 的現實

Kubernetes 上的 GPU scheduling 有一些 CPU workload 不會遇到的地雷:

- **Bin-packing 很重要。** 一個 node 只剩 1 張 GPU、但有兩個 pod 各要 1,兩個都排不上。調整 pod topology spread 來避免碎片化。
- **Tensor-parallel workload** 需要*同一個 node* 上的多張 GPU(要 NVLink)。用 `nodeSelector` 和 `gpu-count=8` 這類 node label 去挑有足夠就近 GPU 的主機。
- **Rolling update 很慢。** 換掉的 pod 要從儲存冷載 50–150 GB 的 model 權重,可能要幾分鐘。rollout 期間要規劃新舊版本的重疊。
- **Pre-pull image、預熱權重**值得做。一個大 LLM container image 可以 20+ GB;要讓它在 pod 需要之前就到 node 上。

## Autoscaling

Kubernetes 預設的 horizontal pod autoscaler(HPA)按 CPU 和記憶體 scale。這兩個對 LLM serving 都沒用。*有用的*訊號是:

- **GPU tokens-per-second。** Throughput 到 plateau,就是接近容量了。
- **Queue 深度。** 等著進 batch 的 request。上升 = 過載。
- **KV 快取使用率。** 快取會比 compute 先滿。
- **Time to first token(TTFT)。** 面對使用者的 canary;只要它上升,某個地方就已經被容量綁住了。

把這些從你的 serving 框架(vLLM、TGI、TensorRT-LLM 都有,慣例各不同)暴露成 Prometheus metric,然後用 **KEDA** 或 Prometheus Adapter + HPA 依它們 autoscale。

小心**冷啟動問題**。一個新的 LLM pod 要好幾分鐘才能起來(pull image、載 model、抓 CUDA graph、warm-up)。用「當下負載」做 autoscaling 太晚。要嘛預留 headroom,要嘛從上游訊號預測需求(首頁流量、上班時間)。

<div class="analogy" markdown>
Autoscale 一個無狀態 web service,像排隊長了就再雇一個咖啡師。Autoscale 一個 LLM service,像是雇一位主廚 —— 他需要時間到場、點火、試高湯,才能接第一張單。不能靠反應式 autoscaling。
</div>

## Observability

一個健康的 LLM serving 儀表板,會比典型 web service 有更多面板。必備的那些:

**Per-request**
- TTFT(time to first token),P50 與 P95。
- TPOT(time per output token,first 之後),P50 與 P95。
- 端到端 latency,P50 與 P95。
- Token 輸入與輸出數。
- 狀態碼與錯誤率。

**Per-pod / per-GPU**
- Running batch size。
- KV 快取使用率。
- Queue 深度。
- Tokens/sec。
- Model FLOPs utilization(MFU),如果框架有暴露。
- 已用 HBM 記憶體。
- `nvidia-smi` 溫度與功耗(看硬體健康,不是看容量)。

**Fleet**
- 總並發 request。
- 每個 deployment 有幾個 replica。
- 每百萬 token 的成本(從 GPU-hour 推)。
- Error-budget 消耗。

**Tracing。** 對多步驟 workload(agent、RAG),分散式 tracing(OpenTelemetry)非常值得。你會想看到單一使用者的 request 一路流經 retrieval、rerank、generation、以及任何 tool 呼叫。

**Log sampling。** 完整 prompt 和 completion log,對每個 request 都留通常太大(而且常常太敏感)。抽樣留小比例、積極輪替、休止時加密。做一條「bug triage」流程,只對標記的 session 留完整 log。

## Scheduling 策略:互動式 vs. 批次

不同 workload 有不同 SLO:

- **互動式**(chat、code completion):要低 TTFT、好的 TPOT。願意犧牲一點 GPU 效率來讓使用者開心。
- **批次**(一個晚上 summarize 10M 份文件):要高 throughput,latency 不重要。把 GPU 灌滿。
- **Streaming async**(RAG pipeline、agent):介於兩者之間。

三種都跑在同一個 cluster 上,要嘛(a)每一類開獨立 replica pool,要嘛(b)一個懂優先權、能在互動式流量衝高時 preempt 批次工作的 scheduler。SGLang 和某些 vLLM 擴充可以做(b);分開 pool 在營運面比較簡單。

## Model 部署模式

把新 model 送進 production 常見的模式:

- **Shadow 流量。** 新版看到真實 request,但回應不會返回給使用者。在線下比較品質。
- **Canary。** 把 1%、5%、25% 路由到新版。盯錯誤率、latency、品質指標。
- **A/B 測試。** 對品質敏感的改動,把不同使用者路由到不同 model,比較下游結果。
- **即時 rollback。** 部署完之後,把舊版熱著保留至少一週。從冷啟動 rollback 很痛。

Model 版本不是微服務版本。一個微服務「壞部署」影響半徑有限;一個 LLM 的壞部署,可以悄悄地讓每個使用者的體驗變差。值得花力氣在部署前 eval 和 canary 期。

## 成本管理

GPU fleet 的成本紀律來自一小串槓桿:

- **GPU 要對得上 model 大小。** 一個 7B model 跑在 H100 上太誇張;用 L40S 或 A10G。
- **量化。** 每降一階 bit 寬度,就是往「每張 GPU 擠進更多使用者」前進一步。見[量化](../04-training/quantization.md)。
- **Batch 甜蜜點。** 過 batch 和不夠 batch 都花錢。要調。
- **能往下 scale。** 不只是往上。晚上、週末、低流量時段 —— 把 replica 砍掉。
- **保留容量(Reserved)。** 對穩定基線流量,reserved 或 committed GPU hour 比 on-demand 省 30–60%。
- **批次用 Spot / preemptible。** 如果你可以容忍中斷,preemptible GPU instance 很便宜。適合一整夜的批次作業。

<div class="numbers" markdown>
<div class="cell"><div class="n">~30–60%</div><div class="l">穩定負載下,reserved 相對 on-demand 的節省</div></div>
<div class="cell"><div class="n">~2–4×</div><div class="l">量化帶來的 throughput 增益,記憶體受限 decode 下</div></div>
<div class="cell"><div class="n">~20–40%</div><div class="l">典型沒最佳化的 serving fleet 浪費掉的 GPU-hour</div></div>
</div>

## LLM serving 的新型失敗模式

你以前沒遇過、但會在這裡遇到的失敗模式:

- **長 context OOM。** 一個 32k token 的 request 可能把 KV 快取 OOM。Server 端要強制 max context。
- **CUDA crash。** 不常見但真實。Pod health check 要對 CUDA 錯誤失敗;通常重啟就解決。
- **換 model 後悄悄的品質回退。** 基礎設施是健康的,但輸出品質不是。只有 eval 抓得到。
- **KV 快取漸進碎片化。** 沒有 paged KV 的 server,長時間 uptime 會讓快取碎片化。現代框架少見,但要留意。
- **冷啟動風暴。** 多個 replica 進入 crash-loop,可能因為權重載入流量把儲存打爆,進而級聯成 cluster 等級的災難。

## 安全面

收錄在 [Infrastructure 學習路徑](../learning-paths/infrastructure.md)(第 7 步)中,這邊摘要:

- 用 **token** 做 rate limit,不只是 request。
- 把取回來的文件當成**不可信輸入**。裡面可能藏 instruction。
- **不要把 secret 放在 system prompt 裡。** 假設使用者會把它抽出來。
- 對下游付費 API 每個使用者設預算上限。
- 敏感的 prompt / completion log 要有小心的保留政策。

## 常見錯誤

- **用 CPU 做 autoscaling。** 講過了。新團隊每週還是會出現一次。
- **把 GPU 當 CPU 用**(分數申請、快速 schedule)。不會動。
- **忽略冷啟動。** 假設 pod 30 秒起來的 autoscaling,遇到 5 分鐘的 LLM 冷啟動會掛。
- **沒有 model 版本策略。** 「我們部署了新的,但舊的權重不見了。」把舊版熱著保留,以便 rollback。
- **觀察性只看基礎設施。** 你也要 per-request 的 token metric —— GPU 可能看起來健康,品質卻在崩。

## 一句話總結

要好好營運一個 LLM fleet,就是去讀*GPU 原生*的訊號(tokens/sec、KV 快取、queue 深度),而不是 CPU 時代的代理指標;為「慢啟動的 pod 和每 request 大狀態」做規劃;並認知 model 品質本身就是一種可靠度指標 —— 不只是 latency。

回到[第五部分目錄](index.md)。
