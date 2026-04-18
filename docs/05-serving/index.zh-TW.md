# 第五部分 —— Serving 與部署

第三部分走過了「一個 token 被生成時會發生什麼事」。第五部分把它 scale 出去:很多 token、很多使用者、很多 GPU,同時在跑、要穩定、成本還要合理。

<div class="hero" markdown>

大規模 serve 一個 LLM,重點基本上不在 model 身上。重點在三個問題:**讓 GPU 忙得夠**(batching、scheduling、speculative decoding)、**把 KV 快取塞得下**(paging、quantization、offload),以及**像工程師那樣處理流量**(autoscaling、observability、優雅地壞掉)。現代的 serving 框架之所以存在,是因為這三件事都難到沒有人想再從頭做一遍。

</div>

## 這部分有什麼

- [Inference server](inference-servers.md) —— vLLM、TGI、TensorRT-LLM、SGLang、llama.cpp。各自是為了什麼。
- [Continuous batching](continuous-batching.md) —— 把 naive serving 的 throughput 拉高約 10 倍的那個單一技巧。
- [GPU cluster operations](cluster-ops.md) —— Kubernetes、observability、autoscaling、安全。

## 為什麼 serving 自成一門學問

一個 web service 和一個 LLM service 都是坐在 HTTP 後面,但相似之處大概就到這為止。有三件事不一樣:

1. **Request 是 per-GPU 有狀態的。** 每個在處理中的 request 的 KV 快取住在 GPU 上,可能幾個 GB。你不能毫無考慮地就把 request 輪流派給各個 replica。
2. **Latency 主要由輸出長度決定。** 一個 500 token 的回應花的時間大約是 100 token 的 5 倍。你的 SLO 要照這件事去設計。
3. **Throughput 和 latency 不是獨立的旋鈕。** 多 batch 幾個使用者,throughput 會上升,但 tail latency 會變差。兩者之間的 Pareto 前緣,就是主要的營運調參面。

如果你是從無狀態微服務的營運過來的,第五部分會告訴你:哪些直覺要留,哪些要更新。

## 一句話帶走

現代 LLM serving 就是三種資源的遊戲:**HBM 頻寬**(你 per-token decode 的天花板)、**HBM 容量**(你的 KV 快取預算)、**GPU-hours**(你的成本)。這部分的所有內容都是關於「把它們花得好」。

從 [Inference server →](inference-servers.md) 開始。
