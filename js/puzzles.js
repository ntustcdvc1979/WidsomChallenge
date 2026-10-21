// ============================================================
//  題目清單 — 新增題目只要在這裡加一筆，並把圖片放進 img/
// ============================================================
//  id     英文小寫、數字、- 或 _，上線後不要再改（答對紀錄靠它）
//  title  題目名稱（投影幕、手機都會顯示）
//  hint   作答提示（手機上顯示）
//  img    圖片路徑，建議 webp
//  type   "text" 文字作答 ／ "number" 數字作答（手機跳出數字鍵盤）／ "card" 撲克牌（花色 + 點數）
//  hashes 正確答案的雜湊，可放多個（多種答案都算對）
//         用 tools/hash.html 產生
//  color  （選填）標籤顏色，不填會自動輪流配色
//
//  順序就是顯示順序，編號（壹、貳、參…）會自動產生。
// ============================================================

export const PUZZLE_LIST = [
  {
    id: "card",
    title: "撲克之謎",
    hint: "猜一張撲克牌",
    img: "img/one.webp",
    type: "card",
    hashes: ["248d206bd32d2c1ad3e9debd1a1542a2c83076a3dcdf484f2ab60c7126215fad"],
  },
  {
    id: "wisdom",
    title: "智慧之問",
    hint: "猜 2 個英文單字",
    img: "img/wisdom.webp",
    type: "text",
    hashes: ["5f02def641b8660568d75dc3924b8ae023cd2bc184b1b476983eaf377905e10b"],
  },
  {
    id: "seven",
    title: "水果之謎",
    hint: "猜 1 個英文單字",
    img: "img/7.webp",
    type: "text",
    hashes: ["7237bd8e7ec8e2b6f1dc410cf3ccc79913e3cde56e5265e853e7a580861b46f4"],
  },
  {
    id: "bear",
    title: "方塊之謎",
    hint: "猜 1 個英文單字",
    img: "img/bear.webp",
    type: "text",
    hashes: ["bf3ff1f31e28f121f21711ba5981da102135c288f650a75684bc3ea70708b653"],
  },
  {
    id: "colors",
    title: "色彩之謎",
    hint: "猜一組 5 位數字",
    img: "img/69253.webp",
    type: "number",
    hashes: ["e31751892b76479f4e1e2d12b0e5c71371f537c3d4dc32500f1d7c3b6bcef644"],
  },
];
