# 測驗 —— Warp、執行緒與區塊

六題關於執行緒階層與佔用率(occupancy)的問題。章節:[Warp、執行緒與區塊](../02-gpu-architecture/warps-threads-blocks.md)。

<div class="quiz-mount"></div>
<script type="application/json" class="quiz-data">
{
  "questions": [
    {
      "answer": "B",
      "stem": "<strong>Q1.</strong> 由小到大排列:",
      "choices": {
        "A": "Block → Thread → Warp → Grid",
        "B": "Thread → Warp → Block → Grid",
        "C": "Warp → Thread → Grid → Block",
        "D": "Grid → Block → Warp → Thread"
      },
      "explain": "<p>一個執行緒就是一個廚師。32 個執行緒 = 一個 warp。最多 1,024 個執行緒 = 一個 block(被分派到單一 SM、共用共享記憶體)。所有 block 合起來 = grid。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q2.</strong> 同一個 block 裡的執行緒,擁有哪兩個「超能力」是跨 block 執行緒沒有的?",
      "choices": {
        "A": "晶片內的 shared memory,以及同步柵欄(<code>__syncthreads</code>)",
        "B": "獨立暫存器配置與硬體分支預測器,讓執行緒間流程更平順",
        "C": "統一的 HBM 存取路徑,以及跨 block 透明的 L2 cache 一致性",
        "D": "獨佔的 Tensor Core 資源,以及一個專屬的 warp scheduler"
      },
      "explain": "<p>在同一個 block 裡:晶片上的共享記憶體,以及同步的能力。跨 block:你只能透過 HBM 溝通,而且在單一次 kernel 啟動裡,block 之間沒辦法同步。</p>"
    },
    {
      "answer": "D",
      "stem": "<strong>Q3.</strong> kernel 執行中,兩個不同的 block 可以直接互相溝通嗎?",
      "choices": {
        "A": "可以,透過 shared memory 直接互相寫入,讓另一個 block 立即讀取",
        "B": "可以,透過 warp scheduler 安排兩個 block 在同一個 SM 上交錯執行",
        "C": "可以,只要兩端都呼叫 __syncthreads 就會自動跨 block 達成同步",
        "D": "不行 —— 只能透過 HBM 溝通,kernel 內也沒有跨 block 的同步柵欄"
      },
      "explain": "<p>block 的互相獨立是刻意設計的:這讓硬體可以把它們放在任何 SM 上、用任何順序、在任何時間執行 —— 也正是這份彈性讓 GPU 程式碼可以從 20-SM 的晶片一路擴展到 132-SM 的晶片,完全不用改碼。</p>"
    },
    {
      "answer": "C",
      "stem": "<strong>Q4.</strong> GPU 上的「佔用率(occupancy)」在量什麼?",
      "choices": {
        "A": "整顆晶片中被通電供應的 SM 比例,反映了 GPU 整體的耗電狀態",
        "B": "當前被使用中的 HBM 容量占總容量的比例,代表記憶體壓力",
        "C": "每個 SM 上實際活著的執行緒/warp 占該 SM 上限的比例",
        "D": "跨整個 grid 中還在執行的活躍 block 總數,反映 kernel 進度"
      },
      "explain": "<p>Occupancy = 一個 SM 上的活躍 warp 數 ÷ 該 SM 的最大 warp 數。佔用率高,代表有更多 warp 可以幫你掩蓋記憶體延遲 —— 但超高也不見得最好(FlashAttention 就是故意用低佔用率、換每個執行緒用很胖的暫存器)。</p>"
    },
    {
      "answer": "B",
      "stem": "<strong>Q5.</strong> 為什麼佔用率低的 SM 會拖累效能?",
      "choices": {
        "A": "晶片會在低占用率下過熱,scheduler 為了節流就只能讓 SM 慢下來",
        "B": "能切換的 warp 太少 —— 一個停頓時,沒有其他 warp 接手,核心閒下",
        "C": "占用率跟吞吐量永遠成正比,所以 occupancy 越低吞吐量也跟著線性下降",
        "D": "Block 因為占用率太低,找不到 SM 上分配給它的 shared memory 區段"
      },
      "explain": "<p>延遲隱藏靠的就是「有備援 warp 可以跑」。如果一個 SM 上只剩幾個 warp,而它們剛好一起在等記憶體,算術單元就會安靜下來。</p>"
    },
    {
      "answer": "A",
      "stem": "<strong>Q6.</strong> 在典型的 matmul kernel 裡,一個 **block** 的工作是什麼?",
      "choices": {
        "A": "算輸出矩陣裡的一塊 tile(例如 128×128),合作把 A、B 切片搬到 shared memory",
        "B": "只算一個單一的輸出格子(例如 C[i][j]),其他格子由其他 block 負責",
        "C": "管理 HBM 控制器與晶片整體的記憶體存取排程,讓 kernel 不會撞牆",
        "D": "在 kernel 啟動時決定自己要被分配到哪個 SM 上跑,並負責後續搬移"
      },
      "explain": "<p>主流樣式:一個 block → 一塊輸出 tile。block 裡的執行緒合作把輸入的條狀切片串流進共享記憶體、同步、餵給 Tensor Core、累加這塊 tile,最後把它寫回 HBM。</p>"
    }
  ]
}
</script>
