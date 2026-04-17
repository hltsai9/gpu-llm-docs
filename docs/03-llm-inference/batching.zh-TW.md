# 同時服務多桌客人(Batching)

現在所有拼圖都到齊了。權重住在 HBM 裡,decode 受限於記憶體,Tensor Core 大部分時間都在閒著等堆高機。那問題就是:有沒有辦法讓堆高機每趟多載一點有用的東西?

有。答案就是 **batching(批次處理)**。

## 核心概念

當模型為「一位使用者」處理一個 token 時,它會從 HBM 把整份權重拉出來,對一個 4,096 維的向量做一點點算術,然後就把權重扔掉。

如果模型同時為 **64 位使用者**各處理一個 token,它一樣把整份權重從 HBM 拉出來 —— 只**拉一次** —— 然後對一個 4,096×64 的矩陣做 64 倍的算術。權重的 HBM 流量一樣,Tensor Core 的工作量卻是 64 倍。

<div class="analogy" markdown>
從裝卸月台推一台空推車回去,這趟就浪費了。推一台裝著 64 位客人食材的滿推車,同樣這一趟卻產能變 64 倍。Batching 做的就是這件事:把昂貴的那趟路,分攤給很多客人。
</div>

這就是為什麼 batching 是 LLM 服務系統裡**最重要的一個**最佳化。它把「受限於記憶體」的工作負載轉成「受限於運算」的工作負載,Tensor Core 終於有活可以幹了。

## 用數字看算術密度怎麼變

拿一個 70B 參數、FP16、單一 decode 步的粗略估算:

**Batch size 1:**

- HBM 流量:約 140 GB 權重(讀進來)+ 約 10 GB KV 快取(單一序列)= 每一步約 150 GB。
- 運算量:約 1400 億次乘加(大致等於每個參數一次)。
- 算術密度:每 byte 約 1 次運算。
- 結論:**完全受限於記憶體。** H100 的巔峰是每 byte 約 295 次運算。你連 Tensor Core 的 1% 都沒用到。

**Batch size 64:**

- HBM 流量:約 140 GB 權重(還是只讀一次 —— 大家共用!)+ 約 640 GB KV 快取(64 條序列)= 約 780 GB。
- 運算量:約 140B × 64 = 約 9T 次乘加。
- 算術密度:每 byte 約 11 次運算。
- 結論:還是受限於記憶體,但好了 11 倍。Tensor Core 使用率也等比例上升。

**Batch size 256:**

- HBM 流量:約 140 GB 權重 + 約 2.5 TB KV 快取 = 約 2.6 TB。
- 運算量:約 36T 次乘加。
- 算術密度:每 byte 約 14 次運算(KV 快取此時已經主導 HBM 流量)。
- 結論:越來越靠近受限於運算,但最後 KV 快取會反過來佔領 HBM 流量。

注意看,**權重**的讀取成本被 batching 漂亮地攤掉了 —— 不管 batch 多大,那 70B 權重每一步都只讀一次。但 **KV 快取**的流量會跟著 batch size 線性增長。到最後,限制記憶體流量的不是權重,而是 KV 快取。

<div class="numbers" markdown>
<div class="cell"><div class="n">1×</div><div class="l">每步的權重讀取,跟 batch size 無關</div></div>
<div class="cell"><div class="n">N×</div><div class="l">每步的 KV 快取讀取,batch = N</div></div>
<div class="cell"><div class="n">N×</div><div class="l">每步生成的 token 數</div></div>
</div>

這就是為什麼現代服務系統瞄準的是「非常大的 decode batch」—— 64、128、256 條並行序列 —— 也是為什麼它們投入巨大的工程努力去縮小 KV 快取,因為 KV 快取就是卡住 batch size 繼續往上爬的那塊牆。

## 靜態 batching:老派作法

最早的做法是**靜態 batching(static batching)**:先收 32 個請求,湊齊一批一起跑,等這 32 個全部跑完,再開下一批。可以動,但有個明顯問題:同一批裡的請求長度不一樣。短的早早跑完卻得空等最長的那個。整體 GPU 使用率會很吃虧。

更慘的是,你沒辦法在 batch 執行到一半時塞新請求進去;遲到的請求得排下一輪。

<div class="analogy" markdown>
靜態 batching 就像旅遊巴士。把人都裝滿、開到終點,然後大家在同一站下車 —— 連那些其實更早該下車的人也得陪到底。最後一段路,車子有一半是空的。
</div>

## 連續 batching:現代作法

**連續 batching(continuous batching)**(也叫 *iteration-level*、*in-flight batching*)是現在的主流做法。它不是在「請求層級」做 batch,而是在 **token 層級**做 batch:

1. 每一步 decode 時,伺服器看所有「還在跑」的序列,把它們全部湊成一個 batched forward pass 一起跑一步。
2. 如果某條序列跑完了(打到最大長度、或吐出結束 token),它就會離開 batch。下一步就少一條序列。
3. 新請求進來時,它會先做 prefill(可能單獨一次呼叫、也可能透過 chunked prefill 交錯進去),然後加入 decode batch。

結果:batch 裡永遠是「正在生成的」序列。跑完的馬上離開、新來的馬上加入,GPU 使用率維持在高檔。

<div class="analogy" markdown>
連續 batching 是共乘小巴,不是旅遊巴士。乘客沿途隨上隨下。一有座位空出來,附近等車的人就立刻補上來。車子永遠幾乎是滿的。
</div>

這就是 vLLM、TensorRT-LLM、TGI、SGLang 這類框架在做的事。概念上其實很簡單;工程上卻不簡單 —— 它要求排程器、attention kernel(要處理長度不一的序列)、記憶體管理器(paged KV 快取)緊密整合起來。

## Batch size 的取捨

Batch 越大 = 吞吐量越高。那為什麼不乾脆無限 batch?

三個必須設上限的理由:

**記憶體。** 每條序列都要自己的一份 KV 快取。Batch size 的上限是「HBM 除以單序列 KV 快取大小」。32K context、用 GQA 的情況下,一張 H100 跑 70B 大概可以容納 20–40 條並行序列 —— 如果不是 GQA、或 context 更長,還會更少。

**延遲。** Batch 越大,每一步 decode 花的時間就越長(更多算術、更多 KV 快取要讀),所以每個使用者感受到的 token 間延遲會變長。一個 batch = 256 可能比 batch = 32 每個 token 慢兩倍,即使整體吞吐量比較高。

**公平性。** 如果你的請求剛好排在一個超長請求後面,你就等比較久。連續 batching 有幫助,但超長序列還是會主導 step time。

服務系統會把 `max_batch_size` 和 `max_tokens_per_batch` 當作可調的旋鈕。營運者會根據產品的 TTFT、ITL 目標去挑適合的值。

## Prefill 的 batching

Prefill 就是另一種情況了。一個 2,000 個 token 的 prefill 請求本身就已經把 Tensor Core 吃滿了(它是受限於運算的)。再疊更多 prefill 請求也不會更快 —— 它們只會排在後面。

Prefill batching 在「你有很多**短** prompt」的情況下還是有用 —— 因為單一個短 prompt 塞不滿整張 GPU。但有個天花板:一旦某個 prefill 本身就大到足以吃滿整顆晶片,再把更多 prefill 湊一起也沒有額外收益。

## Chunked prefill + 連續 decode batching

最花俏的服務系統會把這兩者合起來:

- 一邊持續跑 decode batch,每步都跑。
- 進來的 prefill 被切成 256 或 512 個 token 的 chunk。
- 每個 chunk 被交錯插進 decode batch,讓兩邊都不餓肚子。

這樣不管進來的是「短 prompt + 長生成」、還是「長 prompt + 短生成」的各種組合,GPU 都能被吃滿 —— 這就是現代 LLM 推論服務的黃金標準。

## 值得帶走的重點

- Batching 把「讀 HBM 權重」的成本分攤給很多使用者。
- 它把 decode 從受限於記憶體,推向受限於運算。
- **連續 batching**(token 層級、不是請求層級)是現代伺服器的做法。
- Batch size 的天花板先是被 **KV 快取記憶體**卡住,再來才是延遲限制。
- 服務系統上的每個決策 —— paged KV cache、chunked prefill、GQA、FP8 KV —— 目的都是把那個天花板繼續往上推。

下一章:[受限於記憶體 vs. 受限於運算 →](roofline.md)
