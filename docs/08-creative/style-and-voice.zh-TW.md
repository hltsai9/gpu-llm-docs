# AI 輔助工作裡的風格與聲音

一個 language model 的輸出,沒被干預的話,會漂向一種特定味道 —— 大致親和、結構整齊、喜歡三連排、愛用「In conclusion」和「It's important to note that」。它禮貌、得體、好忘。如果你不跟它對抗,你的作品也會朝那方向走。

這一章是在講怎麼跟它對抗。

## 為什麼平均值拉力那麼強

機制:language model 是被訓練成「給定前面 token 時預測最可能的下一個 token」,跨一個巨大 corpus。「最可能」是統計傾向,意思是未動過的輸出會被拉向統計中心 —— 網路中位寫作者的聲音,再被 instruction tuning(它獎勵小心、像在幫人的語氣)又抹平一層。

<div class="analogy" markdown>
拿一百萬張夕陽的照片,把它們平均起來,你會得到一個糊掉的橘粉漸層。那就是 model 的 default 輸出:平均。任何拍過一張*真正好*夕陽照的人都知道,好那張不會長得像平均 —— 它有一個特定的角度、一個特定的剪影、一個讓它感覺像一個地方的特定瑕疵。你跟 AI 工作的任務,是 prompt 它往一個特定的夕陽走,而不是讓它給你那個漸層。
</div>

**「Generic」AI 輸出在實務上長什麼樣:**

- 開頭是「In today's fast-paced world」之類。
- 一堆平行句、三連排。
- 把跟大眾相反或很具體的觀察,抹平成中性平衡。
- 結尾是「Ultimately, X is a multifaceted issue」或「striking the right balance」。
- 段落結構整齊但沒味道。
- 比喻都很熟:「journey」「landscape」「tapestry」。

你的草稿 match 到以上這些 pattern,你就有一個 genericity 問題。

## 診斷問題

在擔心怎麼修輸出之前,先老實自問:

1. **如果這放在一堆人作品裡,我認得出是我的嗎?** 你在另一個作者的文章看到這段,會眨眼嗎?
2. **這有只有我能講的主張嗎?** 一個從經驗來的具體觀察、一個逆流的看法、一個有名字的細節。
3. **論證的*結構*反映我真的怎麼想嗎?** 不是「intro → 三點 → 結論」,除非你自然就那樣論證。
4. **有沒有一個讓讀者會停下來重讀的時刻?** 一個驚喜、一個笑點、一個尖銳的轉折。那些時刻是你的簽名。

如果以上大多回答不出「yes」,這篇就是 generic 的,而 AI 幫忙弄的。

## 守住聲音的技巧

### 先餵它你的聲音

要它做任何事之前,貼 300–500 字你自己寫的東西,說:

> 「Here is a sample of my writing. Match this voice in what follows.」

再描述任務。這是目前槓桿最高的一步。從範例做 voice transfer,效果遠遠比描述聲音(「寫得 casual 但精確」)好。

### 約束詞彙與結構

講明不能做什麼:

- 「No 'ultimately', no 'multifaceted', no 'strike a balance'.」
- 「Avoid parallelism of three. Use two-item lists or bare sentences.」
- 「Sentences vary in length, not smooth — short, sharp, sometimes a longer one that winds.」

比起模糊的風格備註,model 對具體約束更穩定地聽話。

### 兩遍:先 draft,再 critique

第一次呼叫 draft,另一次呼叫問:

> 「Here's a draft. Identify five places it sounds generic — specifically, places where a lazy writer would use exactly this phrasing. Then rewrite those five passages to be more specific, more surprising, and sharper.」

這有用,是因為 model 常常*認得出*generic 文字,比一次寫出時*避開*它更強。

### 朝自己改寫,不是朝 model

編 AI 輸出的時候,不要往「更流暢」磨。往你自己的耳朵改寫:

- 把抽象換成具體。
- 把平衡換成有立場。
- 把流暢換成凹凸。
- 把「important to note」和它的兄弟姊妹換成那個 point 本身。

一次改寫很快,只要你知道在找什麼。

### 拿它做結構,句子自己寫

最好的 pattern 之一:要 model 列 outline,跟 outline 吵,採用有用的,然後句子自己寫。你守住難的工(句子等級的聲音),把機械的(發想結構)外包。

### 不要接受「還 OK」

「還 OK」是平均值的制服。一段要是「還 OK」,它幾乎從來不是能到的最好。一直迭代 —— 在 prompt 或手工 —— 直到那段要嘛爛(重寫)、要嘛好(一個具體觀察、一個尖銳的轉折、一個有特色的節奏)。

## 視覺作品

同樣原則適用 image 生成,失敗模式不同:

- **「Default Midjourney 美學」。** 戲劇打光、淺景深、飽和色。單張很漂亮;量產就忘。對策是明講你要的美學:紀實、Polaroid、1970 年代雜誌、手繪、特定藝術家或運動。
- **構圖 cliché。** 主體置中、三分法地平線、golden hour。明確變化 framing。
- **角色一致性。** 角色的臉一直微幅變,就是平均值在拉。用 reference、LoRA、或固定 seed(見 [diffusion basics](diffusion-basics.md))。

## 品味這件事

這部分最誠實的一個觀察:AI 工具會放大使用它的人。你如果有強品味、具體偏好,AI 加速你往更好輸出走。你沒有的話 —— 或者你不再鍛鍊它 —— AI 加速你往平均輸出走。

這不是悲觀。意思是*品味*本身才是稀缺的技能。花了年頭養一雙眼的作者覺得 AI 好用,跟木工覺得電鑽好用是同一個道理。還沒養那雙眼的作者會被 AI 迷惑,因為它把他們作品的稜角磨平了,包括那些本來要變成他們聲音的稜角。

你如果在創作生涯早期,用 AI 要小心。有時候手寫 draft。不用工具寫。你認得出哪個 AI 輸出好、哪個 generic 的能力,*正是從*「總是接受第一個輸出」會跳過的那種練習長出來的。

## 「AI 明顯聽起來像 AI」這個迷思

常聽到的說法是 AI 寫作可以偵測。有時可以 —— 在它被懶用時。輕度編輯過的 AI 散文對一般讀者通常分不出來。一篇讓人「覺得像 AI」,最常不是某個具體的 tell;是「具體的缺席」。一篇能用來寫任何產品、任何經驗、任何地方、任何作者的文,會有一種空洞質感。那才是你要避開的簽名,不是某個選字。

反過來也真:聲音強的 AI 輔助寫作,讀起來不像 AI 輔助。瓶頸是聲音,不是工具選擇。

## 出版前 checklist

AI 輔助寫作一份短 pre-ship 例行:

- **只有你能講的具體 claim** —— 每節至少一個。
- **驚喜時刻** —— 每大約 500 字一個。
- **節奏變化** —— 檢查句子長度有變,不是都中等。
- **禁用字掃描** —— 你個人的 AI tell list。Grep。
- **讀出聲** —— Generic 散文唸出來就 generic。你的聲音不會。
- **印出來** —— 紙上慢慢讀。錯和 generic 在螢幕上會躲。

這不久。它是「還 OK 的 AI 草稿」和「一篇剛好有用 AI 的作品」之間的差別。

## 常見錯誤

- **接受第一稿。** 第一稿是平均值。
- **用文字描述聲音,不用範例展示。** 範例贏指令。
- **過度 prompt**(「write like a Pulitzer winner」)。奉承不會讓輸出變好。
- **靠 AI 做創意那一步。** Outline、結構、機械工 —— 可以。句子 —— 如果聲音重要,自己寫。
- **沒注意漂移。** 好幾個月下來,你 AI 輔助的作品開始彼此平均。每季抽代表性樣本稽核。

## 一句話總結

AI 工具把輸出拉向平均;你的手藝是認出這股拉力、朝反方向寫,而這手藝不會因為工具是新的就消失 —— 反而更重要。

下一章:[創意工作流整合 →](creative-integration.md)
