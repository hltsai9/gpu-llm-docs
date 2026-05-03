# 測驗 —— 創作者的 diffusion 基礎

六題,關於圖像 model 怎麼運作、那些旋鈕實際在做什麼。章節:[Diffusion 基礎](../08-creative/diffusion-basics.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 一句話說,diffusion model 在生成時做什麼?",
      "choices": {
        "A": "在巨大的圖像資料庫裡搜尋,挑出最符合 prompt 文字描述的既有照片",
        "B": "從左到右、從上到下,一個 pixel 一個 pixel 順序預測產生整張圖",
        "C": "對隨機噪點塊做迭代去噪,由 prompt 編碼引導每一步,直到乾淨圖像(20–50 步)",
        "D": "在單次 forward pass 裡一次算出整張圖,不需要多步迭代或重新處理"
      },
      "explain": "<p>Diffusion 訓練一個網路一步一步還原噪點。生成就是從純噪點重複跑那個還原。Prompt 的編碼向量引導每一步,朝「表示跟文字匹配」的圖像走。這跟 autoregressive LLM 是不同 paradigm —— 沒有「下一個 token」,只有迭代去噪。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Diffusion 生成裡的 <em>seed</em> 控制的是?",
      "choices": {
        "A": "最終圖像的解析度,以及輸出時每邊的像素尺寸大小",
        "B": "起始隨機噪點塊 —— 同 prompt + 同 seed = 同圖,不同 seed = 不同圖、相同風格",
        "C": "Model 每次生成過程中執行的去噪迭代總數,影響最終品質",
        "D": "Model 是在 GPU 硬體上跑,還是 fallback 到 CPU 處理器執行"
      },
      "explain": "<p>Seed 是隨機過程裡的決定性。你構到一張好圖卻沒存 seed,就不可能重現 —— 不管你多小心重用 prompt。這就是為什麼「存 seed」是認真圖像 model 工作流程的第一條規則。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 圖像看起來過飽和、塑膠感、或「煮過頭」。通常兇手是誰?",
      "choices": {
        "A": "Prompt 寫得太短或太含糊,缺乏 model 需要的風格指引和具體描述細節",
        "B": "解析度設得太低,fine 細節被壓縮、肉眼可見的壓縮瑕疵也會一起跟著上來",
        "C": "去噪步數設得太少,噪點沒有被完全移除,結果整張圖看起來偏向雜訊感",
        "D": "CFG(classifier-free guidance)太高 —— model 被太用力拉向 prompt,sweet spot 是 7–9"
      },
      "explain": "<p>CFG 控制去噪路徑被拉向 prompt 的強度。太低(3–5)= 鬆,可能偏離 prompt。太高(10+)= 塑膠、過飽和、「太努力」。7–9 對多數 model 都行;在這範圍內實驗。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 在正向 prompt 裡寫「no people」常常反效果。為什麼?",
      "choices": {
        "A": "Model 看到「people」這個 token 可能還是產生人 —— 排除該放在獨立的負向 prompt 參數",
        "B": "Diffusion model 完全不能處理「no」這個字或任何形式的否定語法在文字 encoder 裡",
        "C": "Prompt 必須完全用大寫字母,model 才能在編碼階段識別出其中的否定意圖",
        "D": "只有英文 prompt 才支援否定語法,其他語言會走到完全不同的 encoder 路徑"
      },
      "explain": "<p>CLIP 風格的 encoder 不能可靠處理正向 prompt 裡的否定 —— 「people」在文字向量裡的語意存在,仍然可能把圖像拉向人。排除請用負向 prompt 欄位(獨立參數)。多數工具都有,用它。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 你喜歡某次生成的構圖,但想改打光。正確工作流程是?",
      "choices": {
        "A": "希望能在新 prompt 裡把構圖描述得夠準,然後重新跑一次祈禱運氣好",
        "B": "生一大堆隨機 seed 的變體,然後仔細挑一個構圖跟原圖最接近的版本",
        "C": "重用同 seed 搭配修改過的 prompt —— 結構傾向維持,改的字調整屬性",
        "D": "把 CFG 拉到 15,期待強烈的 prompt 約束能把原構圖鎖進後續生成"
      },
      "explain": "<p>同 seed + 不同 prompt 常產生結構相似的圖,改 prompt 的屬性會跟著改。這是微調一張你喜歡構圖的標準技術。Prompt 大改時構圖不一定撐得住 —— 但小改(「同一個場景、黃金時刻打光」)通常會。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> ControlNet 解的是純 prompt 解不了的什麼問題?",
      "choices": {
        "A": "減少需要的去噪迭代步數,讓整個生成過程比純 prompt 快上好幾倍",
        "B": "把結構(pose、邊緣、depth、線稿)當 input 給 model 必須遵守,prompt 控風格和內容",
        "C": "讓使用者不再需要昂貴的 GPU 硬體就能在本地端執行 diffusion model 推論",
        "D": "從生成的圖像中移除原本訓練資料留下的浮水印和授權內容簽名"
      },
      "explain": "<p>ControlNet(和它的親戚)吃一個結構參照 —— pose 火柴人、邊緣圖、深度圖 —— 逼生成圖符合那個結構。Prompt 控風格;ControlNet 鎖構圖。要做穩定的美術指導(角色 pose 一致、用草稿指定構圖),它是質變。</p>"
    }
  ]
}
</script>
