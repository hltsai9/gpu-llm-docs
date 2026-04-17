# 慢慢講清楚 Attention

Attention 是讓 Transformer 之所以是 Transformer 的那個東西。它也是大部分文章最常用一句話帶過的那個東西。這一章會用慢、具體的方式把它走過一遍 —— 目標只有兩個:理解它**為什麼貴**,以及 KV 快取到底**在快取什麼**。

## Attention 要解決什麼問題

序列中的每個 token 都需要上下文。*「bank」* 在 *「river bank」*(河岸)與 *「bank account」*(銀行帳戶)裡意思差非常多。要理解當前的 token,模型就得看其他 token。看哪些?要看整句話。Attention 就是那個讓每個 token **自己決定其他哪些 token 跟它有關**、並從中拉取資訊的機制。

<div class="analogy" markdown>
想像一個會議室,每個與會者手上都有一張便利貼。在開口說話之前,每個人會掃視整個會議室,判斷哪些人對自己接下來要貢獻的內容最相關,然後安靜地把那些人便利貼上有用的部分抄到自己這張。然後每個人依據更新後的便利貼發言。這就是 attention。
</div>

## 每個 token 產生三個向量

對每個 token,模型會用三個各自獨立的矩陣乘法(都作用在 token 當下的表徵上),產出三個向量:

- **Query(Q)** —— 「我在找什麼?」
- **Key(K)** —— 「我代表什麼?」
- **Value(V)** —— 「我帶有什麼資訊?」

當 hidden size 是 4,096 時,每個 token 的 Q、K、V 都是 4,096 維向量。實務上,現代模型會把它們切成很多個 **head** —— 例如 32 個 head,每個 head 128 維 —— 讓每個 head 可以去關注不同類型的關係。我們先不管 multi-head 的細節;單 head 的數學和多 head 一樣,只是向量短一點。

## 步驟 1:把每一對都打分數

Token $i$ 的 query $Q_i$ 會跟每個 token $j$ 的 key $K_j$ 做內積。內積越高 = 越相關。

$$
\text{score}_{ij} = \frac{Q_i \cdot K_j}{\sqrt{d_k}}
$$

除以 $\sqrt{d_k}$ 是在維度變大時避免數字爆炸 —— 為了數值穩定的小技巧,不是核心觀念。

對於長度為 $L$ 的序列,你會得到一個 $L \times L$ 的分數矩陣。每個 token 都跟每個 token 打了分數。

<div class="analogy" markdown>
會議室裡每個人(Q)都瞄了一眼其他人的便利貼(K)。這一瞄會產生一個評分:「此刻這個人對我的相關度有多高?」
</div>

## 步驟 2:Softmax —— 把分數變成權重

對分數矩陣的每一列做 softmax。這會把原始分數轉成一個機率分佈:對 token $i$ 而言,它要花多少 attention 在每個其他 token $j$ 上。權重會非負,而且加總為 1。

$$
a_{ij} = \frac{\exp(\text{score}_{ij})}{\sum_k \exp(\text{score}_{ik})}
$$

你可以一列一列讀它:*「token $i$ 把 40% 的注意力放在 token 3、25% 放在 token 7、10% 留給自己,剩下的平均分散開來。」*

## 步驟 3:Value 的加權總和

對每個 token $i$,用剛剛的 attention 權重,把所有人的 value 向量加權加起來,形成它的新表徵:

$$
\text{output}_i = \sum_j a_{ij} \, V_j
$$

Token $i$ 的輸出向量,就是它所關注的那些 token 的資訊的一個「混合」,混合的比例由 softmax 分數決定。這個輸出就變成下一層的輸入。

<div class="analogy" markdown>
每個與會者依據「對他來說誰最相關」的權重,把別人便利貼上的片段抄到自己這張。這一輪之後,每個人的便利貼都被會議室裡其他人的有用資訊更新了一次。經過很多層之後,每個人的便利貼上就裝著整場會議的深度摘要。
</div>

## 為什麼這麼貴

數一下長度為 $L$、hidden size 為 $d$ 的運算量:

- 算 Q、K、V:三個矩陣乘法,每個都是 $L \times d \times d$。
- 算分數 $QK^T$:一個 $L \times d \times L$ 的矩陣乘法 → 輸出是 $L \times L$。
- 對 $L \times L$ 的矩陣做 softmax。
- 乘上 V:一個 $L \times L \times d$ 的矩陣乘法 → 輸出是 $L \times d$。

$QK^T$ 和「softmax 乘 V」這兩步是**序列長度的二次方**。context 加倍,attention 成本變四倍。這就是為什麼長上下文模型這麼難:從 4K 走到 128K 不是貴 32 倍,而是*在 attention 那幾個運算上*貴 1,024 倍(模型的其他部分成本是線性成長)。

<div class="analogy" markdown>
如果會議人數加倍,每個人要考慮的對象也加倍。兩兩眼神交換的總次數是 $L \times L$,不是 $L$。
</div>

## 因果 attention(給語言模型用的)

語言模型是**自回歸**的 —— 一次一個 token,由左到右生成。在生成過程中,token $i$ 不能看 token $j > i$(未來的 token),因為那些 token 還沒被生出來。我們透過 **因果遮罩(causal mask)** 來強制這件事:在做 softmax 之前,把所有「未來位置」的分數設成 $-\infty$,softmax 之後就等於零。

訓練時這不會節省計算成本 —— 你還是會先算完整個 $L \times L$ 矩陣再遮掉一半。但在推論時它很重要:既然 token $i$ 只關注 token $1..i$,我們就可以**增量地**算 attention,一次加一列、隨生成進度走。這份可增量性,正是 KV 快取的基礎。

## 為什麼 attention 其實對 GPU 還算友善(只要用對技巧)

乍看之下 attention 很恐怖 —— 二次成本、會真的存下一個 $L \times L$ 矩陣,序列一長就大得塞不進共享記憶體。早期的 Transformer 實作真的會把那個矩陣寫進 HBM,然後就吃苦頭了:attention 變成被「分數矩陣的讀寫」綁住的頻寬瓶頸。

**FlashAttention**(2022 年之後)登場。它的技巧是:根本不要把整個分數矩陣存出來。把計算切 tile、隨計算邊走邊重算部分 softmax,把一切都留在共享記憶體 / 暫存器裡。數學完全一樣,HBM 流量暴減。

FlashAttention 不是 attention 的新演算法,它是一個新的**記憶體佈局**。它是一個 kernel,拿「一點點多餘的運算」換「大量減少的記憶體搬動」。在下一章的 roofline 圖上,它會把 attention 從「受限於記憶體、悶悶不樂」的區域,推進到「快樂地受限於運算」的那邊。

<div class="analogy" markdown>
不要把所有眼神交流的完整對照表寫到牆上那張大海報(HBM)再讀回來。FlashAttention 是讓小組內部自己討論:每個小組的參與者互相看一眼、各自算出加權更新,然後只把最終結果寫上海報。所有過程中的草稿,都留在小組那面白板(共享記憶體)上。
</div>

## 用一段話講完 Multi-head Attention

現代 LLM 不是只有一個 attention,而是很多個平行運作的 **head**,每個 head 有自己的 Q、K、V 投影,各自產生不同的輸出。把各 head 的輸出串接起來,再過一個最終投影。你可以把 head 想成「專業分工」:一個 head 可能專注在語法關係、另一個專注在共指(coreference)、另一個專注在數值對齊。Multi-head attention 的成本比聽起來低,因為每個 head 的維度是 $d / h$,總 FLOPs 不變 —— 你等於是用同樣的成本拿到了 $h$ 個不同的「鏡片」。

## 值得帶走的重點

- Attention = 每個 token 自己決定要聽誰的話,然後從那些 token 拉資訊過來。
- 每個 token 有三個向量:Q(query)、K(key)、V(value)。
- 分數 = $QK^T$、權重 = softmax、輸出 = 權重 $\times$ V。
- 成本是**序列長度的二次方**。
- FlashAttention 把草稿資料留在晶片上,消除記憶體瓶頸。
- 所有過去 token 的 K、V 向量,每生成一個新 token 都要再用一次 —— 這就是為什麼我們要把它們快取起來。下一章見。

下一章:[KV 快取 →](kv-cache.md)
