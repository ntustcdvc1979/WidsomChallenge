# 智慧挑戰所

愛心園遊會「闖關體驗」其中一關的解謎網頁。

- `screen.html` — 投影幕：三題同時顯示、每題即時答對人數、答對率、即時快報、QR Code
- `index.html` — 玩家手機：輸入暱稱後可任選題目作答
- 前端：GitHub Pages（純靜態，無需建置）
- 後端：Firebase Firestore + 匿名登入

## 題目

| id | 題目 | 圖片 | 答案 |
|---|---|---|---|
| card | 撲克之謎 | img/one.webp | 梅花 7 |
| wisdom | 智慧之問 | img/wisdom.webp | wisdom hunter |
| seven | 水果之謎 | img/7.webp | seven |

答案在 `js/common.js` 中只存 SHA-256 雜湊。比對時會忽略大小寫、空白，全形字母也算對。要改答案就用 `tools/hash.html` 產生新的雜湊。

## 設定 Firebase（一次性）

1. 到 [Firebase Console](https://console.firebase.google.com/) 建立專案。
2. **Build → Authentication → Sign-in method**，啟用「匿名 (Anonymous)」。
3. **Build → Firestore Database**，建立資料庫（production mode，地區選 `asia-east1`）。
4. 在 Firestore 的 **Rules** 分頁貼上 `firestore.rules` 的內容，然後按「發布」。
5. **專案設定 → 一般 → 你的應用程式**，新增一個 Web 應用程式，把 config 貼到 `js/firebase-config.js`。
6. **Authentication → Settings → Authorized domains**，加入 `ntustcdvc1979.github.io`。

## 部署到 GitHub Pages

推送到 `main` 後，到 repo 的 **Settings → Pages**，Source 選 `Deploy from a branch`，分支選 `main`、資料夾選 `/ (root)`。

- 投影幕：`https://ntustcdvc1979.github.io/WidsomChallenge/screen.html`
- 玩家：`https://ntustcdvc1979.github.io/WidsomChallenge/`（投影幕上的 QR Code 會連到這裡）

## 活動當天

- 投影幕按「全螢幕」。點任一題卡片可以放大圖片。
- 每一梯次開始前按「開新場次」，會產生新的 `?room=` 和新的 QR Code，計數從 0 開始，舊資料仍會保留。
- 玩家三關全破時，手機會出現「三關全破」畫面，可以給關主看後蓋章。

## 注意

答案是在玩家手機上比對的（沒有使用 Cloud Functions）。懂技術的人可以偽造答對紀錄。對園遊會來說這樣夠用；如果需要嚴格驗證，就要改用 Cloud Functions（需要 Blaze 方案）。
