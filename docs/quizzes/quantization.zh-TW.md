# 測驗 —— 量化深入

六題,關於精度格式、calibration,以及 bit 降階的經濟學。章節:[量化深入](../04-training/quantization.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 為什麼 4-bit 量化在 benchmark 上常常只掉 1–2 分,即使 bit 丟了 75%?",
      "choices": {
        "A": "現代模型訓練時就預期這種 loss,所以有冗餘",
        "B": "Benchmark 本身對精度不敏感",
        "C": "LLM 權重高度集中在 0 附近、偶有離群值 —— 這種分布只要把 bit 放在質量聚集處,用很少的 bit 也能抓住重點",
        "D": "4-bit 儲存在量化之上又做了 lossless 壓縮"
      },
      "explain": "<p>量化靠的是分布形狀。均勻分布(音訊採樣、一般像素)每個 bit 都重要;LLM 權重像一堆沙,0 附近一大峰,尾巴薄薄拉一條。把 bit 分配到質量聚集處,就能壓得比直覺想像更狠。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> BF16 和 FP16 實務上的差別是什麼?",
      "choices": {
        "A": "兩者一模一樣 —— exponent 和 mantissa 一樣",
        "B": "BF16 有 FP32 的寬動態範圍(8 exponent bits)、精度較低;FP16 精度較好但範圍窄,訓練時梯度會 overflow",
        "C": "BF16 每個值 4 bytes,FP16 是 2 bytes",
        "D": "BF16 只在 AMD 上跑,FP16 只在 NVIDIA"
      },
      "explain": "<p>BF16(bfloat16)犧牲 mantissa 換 exponent —— 用一半空間 match FP32 的範圍。這也是為什麼它是訓練預設:梯度可以跨好幾個數量級,BF16 不會 overflow。FP16 推論沒問題,但舊硬體上訓練常出狀況。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q3.</strong> Weight-only 量化(LLM 常見做法)在 matmul 時怎麼運作?",
      "choices": {
        "A": "INT4/INT8 存的權重即時 dequant 回 BF16/FP16,和 BF16 activation 相乘,結果是 BF16",
        "B": "所有東西(包含 activation)都保留在 INT4",
        "C": "GPU 的 tensor core 直接做 INT4 × INT4 的乘法,不 dequant",
        "D": "權重保持 INT4,activation 也先量化成一樣"
      },
      "explain": "<p>Weight-only 量化把權重用 4-bit 存和<em>傳輸</em>(省記憶體、省頻寬),但乘法之前 dequant 回高精度。算的部分保持較高精度,品質就守住 —— 而 decode 是記憶體頻寬 bound,省下的頻寬就直接變 throughput。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q4.</strong> GPTQ(或 AWQ)在 calibration 時做了什麼是單純 round 做不到的?",
      "choices": {
        "A": "Round 完再做 lossless 壓縮",
        "B": "整個模型在低精度重新訓練",
        "C": "傳輸權重用的網路協定",
        "D": "拿一小批代表性樣本跑過模型,量測 activation 和權重的實際分布,再挑保留重要質量的 per-layer scale"
      },
      "explain": "<p>Post-training 量化用 128–512 筆 calibration 樣本找好的 scale。AWQ 再多一步:辨識「salient」權重、保留精度,其他壓得更狠。這個 calibration 就是 4-bit 品質能接受的關鍵 —— 直接 round 掉很多。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 70B 模型 BF16 是 140 GB。INT4 大概是多少?",
      "choices": {
        "A": "~70 GB",
        "B": "~18 GB",
        "C": "~35 GB",
        "D": "不變 —— 量化不會減少權重儲存"
      },
      "explain": "<p>BF16 每個參數 2 bytes;INT4 是 0.5 bytes。4× 的減少把 140 GB 變 35 GB,能舒服地塞進一張 H100(80GB),還留得下 KV cache 和 activation 的空間。這就是 70B 單卡推論成為可能的原因。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 哪種部署目標最適合用 GGUF(而不是 GPTQ 或 AWQ)?",
      "choices": {
        "A": "大規模 NVIDIA 資料中心搭配 vLLM",
        "B": "Apple Silicon、純 CPU、edge/桌面,用 llama.cpp 跑",
        "C": "H100 上的訓練",
        "D": "QLoRA 的 fine-tune 訓練"
      },
      "explain": "<p>GGUF 是 llama.cpp 與 Apple Silicon 生態圈用的檔案格式,包了多種量化 schema(Q4_K_M、Q5_K_M、Q6_K 等)為 CPU 和統一記憶體 GPU 調校。資料中心 NVIDIA → GPTQ/AWQ;edge 和 Mac → GGUF。</p>"
    }
  ]
}
</script>
