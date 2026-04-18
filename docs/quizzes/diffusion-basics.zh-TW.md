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
        "A": "在圖像資料庫裡搜尋跟 prompt 最像的",
        "B": "從左到右一個一個預測下一個 pixel",
        "C": "對一塊隨機噪點起點做迭代去噪 —— 每一步預測要移除什麼噪點、由 prompt 編碼引導 —— 直到留下乾淨圖像(通常 20–50 步)",
        "D": "單次 forward pass 直接算出圖像"
      },
      "explain": "<p>Diffusion 訓練一個網路一步一步還原噪點。生成就是從純噪點重複跑那個還原。Prompt 的編碼向量引導每一步,朝「表示跟文字匹配」的圖像走。這跟 autoregressive LLM 是不同 paradigm —— 沒有「下一個 token」,只有迭代去噪。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q2.</strong> Diffusion 生成裡的 <em>seed</em> 控制的是?",
      "choices": {
        "A": "最終圖像的解析度",
        "B": "起始隨機噪點塊 —— 同 prompt + 同 seed = 同圖;同 prompt + 不同 seed = 不同圖、相同風格",
        "C": "Model 的總去噪步數",
        "D": "Model 用 GPU 還是 CPU"
      },
      "explain": "<p>Seed 是隨機過程裡的決定性。你構到一張好圖卻沒存 seed,就不可能重現 —— 不管你多小心重用 prompt。這就是為什麼「存 seed」是認真圖像 model 工作流程的第一條規則。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> 圖像看起來過飽和、塑膠感、或「煮過頭」。通常兇手是誰?",
      "choices": {
        "A": "Prompt 太短",
        "B": "解析度太低",
        "C": "去噪步數不夠",
        "D": "CFG(classifier-free guidance)太高 —— model 被太用力拉向 prompt,犧牲自然感。7–9 是常見 sweet spot;10+ 常煮過頭"
      },
      "explain": "<p>CFG 控制去噪路徑被拉向 prompt 的強度。太低(3–5)= 鬆,可能偏離 prompt。太高(10+)= 塑膠、過飽和、「太努力」。7–9 對多數 model 都行;在這範圍內實驗。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> 在正向 prompt 裡寫「no people」常常反效果。為什麼?",
      "choices": {
        "A": "Model 看到「people」這個 token,可能還是產生人 —— 排除該放在獨立的<em>負向 prompt</em> 參數,model 是訓練成去避開的",
        "B": "Diffusion model 不能處理「no」這個字",
        "C": "Prompt 必須全大寫",
        "D": "否定式只有英文才行"
      },
      "explain": "<p>CLIP 風格的 encoder 不能可靠處理正向 prompt 裡的否定 —— 「people」在文字向量裡的語意存在,仍然可能把圖像拉向人。排除請用負向 prompt 欄位(獨立參數)。多數工具都有,用它。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 你喜歡某次生成的構圖,但想改打光。正確工作流程是?",
      "choices": {
        "A": "希望用新 prompt 能把構圖描述得夠準",
        "B": "生一堆變體,挑一個對的",
        "C": "重用同 seed 搭配修改過的 prompt —— 結構傾向維持,被改的字會調整特定屬性像打光或風格",
        "D": "把 CFG 拉到 15"
      },
      "explain": "<p>同 seed + 不同 prompt 常產生結構相似的圖,改 prompt 的屬性會跟著改。這是微調一張你喜歡構圖的標準技術。Prompt 大改時構圖不一定撐得住 —— 但小改(「同一個場景、黃金時刻打光」)通常會。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> ControlNet 解的是純 prompt 解不了的什麼問題?",
      "choices": {
        "A": "讓生成更快",
        "B": "你可以把結構(pose、邊緣、depth、線稿)當 input 給,model 必須遵守 —— 輸出就符合指定的構圖,同時 prompt 控風格和內容",
        "C": "不再需要 GPU",
        "D": "移除圖像浮水印"
      },
      "explain": "<p>ControlNet(和它的親戚)吃一個結構參照 —— pose 火柴人、邊緣圖、深度圖 —— 逼生成圖符合那個結構。Prompt 控風格;ControlNet 鎖構圖。要做穩定的美術指導(角色 pose 一致、用草稿指定構圖),它是質變。</p>"
    }
  ]
}
</script>
