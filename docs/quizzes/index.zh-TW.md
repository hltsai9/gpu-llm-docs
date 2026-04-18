# 測驗題庫

每章配一組簡短的測驗 —— 每組五到六題選擇題。選一個答案就會立刻告訴你對不對,再附上一小段「為什麼」。

分數不會被存在任何地方,重新整理就重新開始。想不重新整理就再來一次的話,點頁面底部的 **Reset quiz**。

## 第一部分 —— 為什麼需要 GPU

- [自助餐廳 vs. 牛排館](cpu-vs-gpu.md)
- [吞吐量優於延遲](throughput-vs-latency.md)
- [同步運作的廚房(SIMT)](simt.md)

## 第二部分 —— GPU 架構

- [GPU 的解剖學](anatomy.md)
- [記憶體階層](memory-hierarchy.md)
- [Warp、執行緒與區塊](warps-threads-blocks.md)
- [Tensor Core](tensor-cores.md)

## 第三部分 —— LLM 推論

- [Token 是什麼?](token.md)
- [一個 token 的一生](life-of-a-token.md)
- [Attention](attention.md)
- [KV 快取](kv-cache.md)
- [Prefill 與 Decode](prefill-vs-decode.md)
- [Batching](batching.md)
- [受限於記憶體 vs. 受限於運算(roofline)](roofline.md)

## 第四部分 —— 訓練與 Fine-Tuning

- [訓練 vs. 推論](training-vs-inference.md)
- [Fine-tuning 光譜](fine-tuning-spectrum.md)
- [量化深入](quantization.md)
- [分散式訓練](distributed-training.md)

## 第五部分 —— Serving 與部署

- [Inference server](inference-servers.md)
- [Continuous batching](continuous-batching.md)
- [GPU cluster 運營](cluster-ops.md)

## 第六部分 —— 用 LLM 打造東西

- [開發者的 API 基礎](api-basics.md)
- [Prompt engineering 模式](prompt-engineering.md)
- [Retrieval-Augmented Generation](rag.md)
- [Tool use 和 agent](tool-use-agents.md)
- [真正可用的 eval](evals.md)

## 第七部分 —— 策略與產品

- [能力地圖](capability-mapping.md)
- [LLM 產品的經濟學](economics.md)
- [風險與治理](risk-governance.md)

## 第八部分 —— 創意工作流

- [創作者的 diffusion 基礎](diffusion-basics.md)
- [風格與聲音](style-and-voice.md)
- [創意工作流程整合](creative-integration.md)

!!! tip "怎麼用這些測驗"
    在重讀章節之**前**先做一遍測驗。答錯的題目就是那一章裡值得再翻一次的地方。每一題的答案,對應的那篇文章裡一定都有。
