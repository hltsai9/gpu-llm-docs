# 給創意人的 diffusion basics

LLM 是在預測下一個 token。Image model 不是。它們基於一個根本不同的原理,叫 *diffusion*;而這件事的實務意義,每次當你被 Midjourney 或 Stable Diffusion 嚇一跳時,都會冒出來。

這一章不是完整的工程講解。這是一個在創作的人,要能*有意識*地 prompt image model(而不是靠運氣)需要的心智模型。

## 蓋子底下在做什麼

從一個簡單洞察開始:拿任一張圖,幫每個 pixel 加一點隨機 noise。一直加。加夠多次,你就得到一片純靜電。

現在倒過來。訓練一個神經網路,去看一張有 noise 的圖,預測*要移除什麼 noise*才會讓它少一點 noise。反覆跑這件事 —— 從純靜電開始 —— model 就能慢慢把自己 denoise 成一張乾淨的圖。

這就是 diffusion model。它被訓練得很擅長「降一步 noise」。生成就是反覆套用那一步,可能做 20–50 次,從全 noise 到最後的圖。

<div class="analogy" markdown>
雕刻家從一塊粗糙的石塊開始,鑿掉「所有不是雕像的部分」。Diffusion model 從一塊隨機 noise 開始,鑿掉「所有不是你 prompt 描述的那張圖的部分」。差別是雕刻家知道自己在做什麼;model 是每一步都在讀你的 prompt,才決定下一鑿往哪裡鑿。
</div>

## Prompt 在哪進來

Model 在每一步的引導,是你 text prompt 的 vector encoding,由一個另外的 text encoder(CLIP 或類似)產生。那個 vector 把 denoise 過程拉向「表示向量匹配這段文字的」圖。

含意:

- **Prompt 是方向,不是樣板。** 「A cat on a chair」把 denoise 推向像貓在椅子上的輸出。不同的 seed(起始 noise)會產出不同的貓和椅子。
- **特定字有特定權重。** 「Oil painting」帶著一整套學來的視覺風格聯想,是從被這樣標的訓練圖像累積起來的。
- **Prompt 順序與強調有差。** 大多工具支援 `(word:1.3)` 語法或「依位置加權」的慣例。Encoder 對這些敏感。
- **「Not X」常常沒用。** Prompt 寫「no people」可能反而*加*人(model 抓住「people」這個 token)。要排除的話用 negative prompt(另外一個參數)。

## Seed:隨機工具裡的確定性

每一次生成都從一塊隨機 noise 開始。*Seed* 決定那塊起始點。

- **同 prompt + 同 seed = 同一張圖。** 要可重現時用。
- **同 prompt + 不同 seed = 不同構圖、同樣風格。** 要變體時用。
- **不同 prompt + 同 seed** = 結構相似、渲染不同。想做細微調整時用。

Seed 是為什麼你會拿到一張很愛的構圖、然後再也回不去 —— 你需要那個 seed,不只 prompt。

## Sampling steps 與 CFG

另外兩個有影響的旋鈕:

- **Steps。** 要 denoise 幾次。越多 = 細節越多,有上限。20–40 是典型。超過 60 就邊際效用遞減,偶爾還 overcook。
- **CFG(classifier-free guidance)。** 要多用力拉向 prompt。低 CFG(3–5)= 鬆一點,比較有創意。高 CFG(10+)= 字面對,但可能看起來像過熟或塑膠感。7–9 是常見甜蜜點。

懂這兩個,才能診斷輸出。「看起來過熟」通常是 CFG 太高。「看起來完全不像我 prompt」常常是 CFG 太低或 step 太少。

## 有用的 prompt pattern

### 結構化 prompt

一個常見的 scaffold:

1. **主體。** 「A weathered lighthouse」
2. **動作 / 環境。** 「on a rocky cliff during a storm」
3. **風格。** 「in the style of an oil painting」
4. **打光。** 「dramatic backlighting, long shadows」
5. **構圖 / framing。** 「wide angle, from below」
6. **品質提示。** 「highly detailed, cinematic」

順序不是什麼魔法,但有這個結構幫你記住什麼沒寫到。

### Reference-based prompt

現代工具支援 reference image。主要兩種:

- **Image-to-image。** Model 從你的 reference 而不是純 noise 開始。Prompt 引導變化。適合構圖的變體。
- **Style reference。** Model 從 prompt 生新內容、但 match 你 reference 的風格。

Reference 比純文字給你多得多的控制。描述風格沒在寫對時,找一個視覺 reference。

### ControlNet 和結構 reference

ControlNet(和它親戚)讓你指定結構:姿勢、edge map、depth map、線稿。Model 在符合那個結構下生成圖。

例子:畫一個火柴人姿勢 → ControlNet 把那個姿勢強制在輸出 → prompt 描述角色。姿勢鎖住,風格與身分從 prompt 來。

要做可靠、可重現的美術指導,ControlNet 是變革性的。

### Inpainting 與 outpainting

- **Inpainting。** 把一個區域遮住;要 model 依 prompt 只重生成那一塊。修細節、換元素、迭代很好用。
- **Outpainting。** 延伸畫布;model 把新區域補成跟原本一致。事後調整構圖很好用。

兩個都能動,是因為 diffusion 天生處理「在限制下生成」—— 已經存在的 pixel 就是「已經 denoise 過的」區域,model 在它們周圍填。

## 常見的驚訝,解釋

### 「為什麼同一個 prompt 給完全不同的圖?」

不同 seed。設 seed 就可重現。

### 「為什麼 prompt 小小改一下,整張圖被洗牌?」

Prompt 改變引導 vector。如果這改動把 vector 移到學到空間的另一個區域,整條 denoise 路徑就漂了。小的文字改動可能 = 大的圖片改動,反之也會。

### 「為什麼它做不好手 / 文字 / 特定的手指?」

手難是因為它結構複雜(很多關節,自遮擋,正確 configuration 很多),而且訓練資料很雜。文字難是因為要 pixel-exact 的字形,這件事 diffusion 不太擅長。較新的 model(SDXL-Lightning、FLUX、Midjourney v6+)有進展;兩個都還沒完全解決。文字的話用另外的工具或合成。

### 「為什麼它有時候會生出近乎原訓練圖的複製?」

Diffusion model 不是在「搜尋」match([創意學習路徑](../learning-paths/creative.md)的誤解那節有講),但對於在訓練資料裡極度過度呈現的圖或很獨特的圖,它*可以*重現 —— 特別是名畫、iconic 照片、或有名的產品照。prompt 著名主題時要注意。

### 「為什麼我的角色在不同生成裡臉會變?」

沒 reference 或一致性工具,每次生成都會重新 sample 一個角色身分。用:

- **該角色的 reference image。**
- **Character LoRA**(掛在 base model 上的小型 fine-tune)給特定角色。
- **固定 seed** 在同一場景裡維持一致。

## 2025 年的工具版圖

- **Midjourney。** 美學 default 強,最容易生出看起來好看的輸出,Discord 為基礎的工作流(web UI 在進化中)。付費。
- **DALL·E(在 ChatGPT、Bing 等裡面)。** 跟 LLM prompt 整合緊,自然語言修改很順。內容政策保守。
- **Stable Diffusion(以及後代:SDXL、SD3)。** Open-source、可自架、巨大的 LoRA 與 ControlNet 生態。需要比較多 setup。
- **FLUX。** 2024 開源發布,圖像品質強,相對同儕文字渲染優秀。
- **Ideogram。** 專門處理有文字的圖。
- **Adobe Firefly。** 訓練資料商用安全,與 Creative Cloud 整合緊。

挑的時候看:

- 你能接受多少 setup(Midjourney vs. 本地 SD)。
- 你要不要商用安全的訓練來源(Firefly)。
- 你工作流整合(ChatGPT 拿來迭代自然語言、Photoshop 做 inpainting-in-context)。
- 你要不要角色一致性或特定風格(SD + LoRA)。

## 這章沒講到什麼

- **Video model**(Sora、Runway、Veo、Kling)—— 類似 diffusion 原理,但 temporal consistency 加了複雜度。值得自己一章。
- **3D**(Gaussian splatting、有 AI 輔助的 NeRF)—— 演得快;production 使用還在冒出來。
- **Audio 與 music**(Suno、Udio、ElevenLabs)—— 不同的 model family,常常比較接近 language model 而不是 diffusion。

## 常見錯誤

- **不理 seed。** 你一直在試找回一個很愛的構圖。存 seed。
- **用正面句型寫排除。** 「No people」常失敗;用 negative prompt。
- **描述過多。** 60 字的 prompt 常常比 15 個挑好的字輸出還糟。
- **沒 reference 就期待一致性。** 角色身分沒幫手不會 persist。
- **生一次就結束。** 批次生 4 或 8 張;分布才是你找到好那張的方式。
- **CFG 拉到最大。** 產出塑膠感、過飽和的圖。降下來。

## 一句話總結

Diffusion 是被你的 prompt 引導的迭代 denoise —— 所以 prompt 是方向,seed 挑起點,而手藝就是學會哪個旋鈕(steps、CFG、reference、mask)影響輸出的哪個面向。

下一章:[風格與聲音 →](style-and-voice.md)
