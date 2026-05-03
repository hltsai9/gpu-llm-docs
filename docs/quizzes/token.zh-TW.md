# 測驗 —— Token 是什麼?

Token 與 tokenization 的六題小測驗。章節:[Token 是什麼?](../03-llm-inference/token.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "C",
      "stem": "<strong>Q1.</strong> 從模型的角度看,一個 token 是什麼?",
      "choices": {
        "A": "訓練語料中的一個完整英文單字,被對應標記到一個 ID",
        "B": "輸入文本中的一個 Unicode 字元或位元組,沒有進行任何合併",
        "C": "一個整數 ID,指向訓練時就固定下來的詞彙表的其中一列",
        "D": "每個輸入都動態學習並產生的一個浮點向量"
      },
      "explain": "<p>Token 就是一個整數 ID。這些 ID 指向一張詞彙表(通常 30K 到 200K 項目),這張表在訓練時就一次決定好。之後的 embedding 步驟才把 ID 轉成向量。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q2.</strong> 為什麼現代 LLM 用次詞(sub-word)tokenization,而不用「字級(一個字一個 token)」?",
      "choices": {
        "A": "Sub-word tokenization 的實作明顯比較簡單且容易維護",
        "B": "字級方法會在推論時需要更多的 GPU 記憶體來處理大批次",
        "C": "Sub-word 能把 attention 複雜度從 O(n²) 保證變成 O(n)",
        "D": "字級會被詞形變化撐爆詞彙量,也處理不了沒看過的字、人名、URL、程式碼"
      },
      "explain": "<p>字級會在新字(<em>ChatGPT</em>、<em>rizz</em>)上整個卡住,在黏著語(芬蘭文、土耳其文)會炸開,也沒辦法表示人名、程式碼或 URL。次詞則能把詞彙量壓在合理範圍、沒有未知詞問題、序列長度也實用 —— 是實務上的折衷。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q3.</strong> BPE(Byte-Pair Encoding)是怎麼建出詞彙表的?",
      "choices": {
        "A": "用神經網路訓練每個句子動態預測的 tokenization 方式",
        "B": "它從單一位元組 / 字元開始,貪婪地把最常出現的相鄰「一對」合併成新符號,重複到詞彙量達到目標",
        "C": "替字典裡每一個字分配一個 token ID,沒見過的字隨機分割",
        "D": "用 hash 函數把每個字詞對應到固定大小的整數編碼"
      },
      "explain": "<p>BPE 是迭代式的貪婪合併。統計語料裡相鄰「對」的頻率,把最常見的那一對合併成新符號,再重複。最後這一串「按順序的合併」就是 tokenizer 在推論時會對新輸入重播的操作。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q4.</strong> Byte-level BPE(GPT-2 之後那一派使用的版本)最關鍵的性質是什麼?",
      "choices": {
        "A": "起始字母表是 256 個位元組值,所以任何字串都表示得出來 —— 永遠不會「超出詞彙表」",
        "B": "它比字元級 BPE 的 tokenize 速度更快,因為在基礎字母表就開始合併",
        "C": "它讓 &lt;eos&gt; 這類特殊 token 在生成時變成不必要",
        "D": "它比字元級 BPE 壓縮文字壓得更兇,用更少的 token 表示"
      },
      "explain": "<p>Byte-level BPE 保證任何輸入都能被 tokenize,因為任何字串都是位元組序列,而 256 個位元組值全在最底層的詞彙裡。真的完全不熟的文字,最糟就是一個位元組一個 token —— 永遠不會當掉、也不會吐 &lt;unk&gt;。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q5.</strong> 像 <code>&lt;eos&gt;</code>、<code>&lt;|user|&gt;</code> 這種特殊 token 是做什麼用的?",
      "choices": {
        "A": "是標點符號,tokenizer 當作逗號、句號這類一般文字",
        "B": "是預留給訓練語料沒見過的詞彙使用",
        "C": "它們傳達的是系統需要的「結構訊號」(序列結束、角色邊界、padding),不會顯示給使用者看",
        "D": "它們只在訓練期間使用,部署時會從模型中移除"
      },
      "explain": "<p>特殊 token 是元訊號:序列結束、開始、padding、角色標記。它們跟一般 token 共用同一張詞彙表,但不會出現在使用者看到的文字裡 —— detokenization 時會被拿掉,或由聊天介面另外呈現。沒加對角色標記的話,聊天模型會搞不清楚現在輪到誰講話。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q6.</strong> 為什麼中文(或日文、韓文、泰文、阿拉伯文⋯⋯)通常每單位意思要吃比英文更多的 token?",
      "choices": {
        "A": "模型的 attention 機制對這類語言調整權重計算",
        "B": "BPE 的詞彙是在以英文為主的語料上訓練的,所以非英文常見的連續片段沒被合併成單一 token,只能一路退回更小的片段",
        "C": "非拉丁文字的 Unicode 字元在設計上被編成多個 token",
        "D": "非英文的語言只能用原始位元組儲存,英文才可以進行合併"
      },
      "explain": "<p>BPE 合併的是「在訓練語料裡最常出現的那一對」。如果某種語言在語料裡比例低,它的常見序列就沒機會爬到合併順序的前面 —— 於是 tokenize 時就會被切成很多小片段。比較新的多語系 tokenizer(o200k、Llama 3 的 128K、Claude 的 200K)縮小了差距但沒有消除,所以非英文的呼叫還是會吃更多 token、上下文也會更快被吃滿。</p>"
    }
  ]
}
</script>
