# 智慧挑戰所

愛心園遊會「闖關體驗」其中一關的解謎網頁。

- `screen.html` — 投影幕：所有題目同時顯示（題數多時自動分排）、每題即時答對人數、答對率、即時快報、QR Code
- `index.html` — 玩家手機：輸入暱稱後從題目列表任選一題作答
- 前端：GitHub Pages（純靜態，無需建置）
- 後端：Firebase Firestore + 匿名登入

## 題目

| id | 題目 | 圖片 | 答案 |
|---|---|---|---|
| card | 撲克之謎 | img/one.webp | 梅花 7 |
| wisdom | 智慧之問 | img/wisdom.webp | wisdom hunter |
| seven | 水果之謎 | img/7.webp | seven |
| bear | 方塊之謎 | img/bear.webp | bear |
| colors | 色彩之謎 | img/69253.webp | 69253 |

答案在 `js/puzzles.js` 中只存 SHA-256 雜湊。比對時英文大小寫都接受（BEAR、bear、Bear 都算對），空白和全形字母也不影響。

## 新增題目

1. 把圖片轉成 webp 放進 `img/`（cwebp 在 Anaconda 裡就有）：
   ```
   cwebp -q 85 新圖片.jpg -o img/新圖片.webp
   ```
2. 用瀏覽器開 `tools/hash.html`（線上版：`https://ntustcdvc1979.github.io/WidsomChallenge/tools/hash.html`），填好 id、名稱、提示、圖片檔名、答案（可以填多種寫法），按「產生」。
3. 把產生的程式碼貼進 `js/puzzles.js` 的 `PUZZLE_LIST`，然後 commit、push。

不用改 Firestore 規則或其他程式。編號（壹、貳、參…）、配色、投影幕排版（1 排最多 4 題，超過會自動分排）都會自動調整。已經上線的題目不要改 `id`，不然舊的答對紀錄會對不上。

## 設定 Firebase（一次性）

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案。
2. **Build → Authentication → Sign-in method**，啟用「匿名 (Anonymous)」。
3. **Build → Firestore Database**，建立資料庫（production mode，地區選 `asia-east1`）。
4. 在 Firestore 的 **Rules** 分頁貼上 `firestore.rules` 的內容，然後按「發布」。（`firestore.rules` 有更新時要再貼一次，Firebase 不會自動讀 repo 裡的檔案。）
5. **專案設定 → 一般 → 你的應用程式**，新增一個 Web 應用程式，把 config 貼到 `js/firebase-config.js`。
6. **Authentication → Settings → Authorized domains**，加入 `ntustcdvc1979.github.io`。

## 部署到 GitHub Pages

推送到 `main` 後，到 repo 的 **Settings → Pages**，Source 選 `Deploy from a branch`，分支選 `main`、資料夾選 `/ (root)`。

- 投影幕：`https://ntustcdvc1979.github.io/WidsomChallenge/screen.html`
- 玩家：`https://ntustcdvc1979.github.io/WidsomChallenge/`（投影幕上的 QR Code 會連到這裡）

## 活動當天

- 投影幕按「全螢幕」。點任一題卡片可以放大圖片。
- 每一梯次開始前按「開新場次」，會產生新的 `?room=` 和新的 QR Code，計數從 0 開始，舊資料仍會保留。
- 玩家全部破關時，手機會出現「全部破關」畫面，可以給關主看後蓋章。

## 資料結構

- `rooms/{場次}/players/{uid}`：玩家暱稱
- `rooms/{場次}/solves/{uid}_{題目id}`：每一筆答對紀錄

玩家答對時畫面會馬上顯示「答對了」，成績在背景上傳。如果網路斷掉，會自動重試，玩家不用重按。

## 注意

答案是在玩家手機上比對的（沒有使用 Cloud Functions）。懂技術的人可以偽造答對紀錄。對園遊會來說這樣夠用；如果需要嚴格驗證，就要改用 Cloud Functions（需要 Blaze 方案）。
