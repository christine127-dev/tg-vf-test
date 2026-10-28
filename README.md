# V-Flow 挑戰賽 — GitHub Pages 版

TopGlow 前線培訓測驗：操作與原理 300 題、銷售話術 157 題，各分初／中／高三級。密碼閘、入名、Google Sheet 排行榜。

## 檔案

```
index.html              整個測驗（題庫已內嵌）
config.js               只有一行：Google Sheet API 嘅 URL
assets/topglow-hero.mp4 頂部背景片（720p 靜音，1.3MB）
assets/topglow-poster.jpg
apps-script/Code.gs     Google Sheet 後端，貼入 Apps Script
```

## Setup（大約 15 分鐘）

### 第 1 步：Google Sheet 做排行榜後端

1. 開一個新嘅 Google Sheet（任何名，例如 `V-Flow Quiz Scores`）。
2. 上面 menu：**Extensions → Apps Script**。
3. 刪走預設嗰段 code，將 `apps-script/Code.gs` 成份貼入去，Save（Ctrl/Cmd+S）。
4. 右上角 **Deploy → New deployment**。
5. 左邊齒輪揀 **Web app**。
   - Description：隨便
   - **Execute as：Me**
   - **Who has access：Anyone**
6. 撳 Deploy。第一次會要你 Authorize：揀你嘅 Google 帳號 → Advanced → Go to (unsafe) → Allow。（呢個係 Google 對自己寫嘅 script 嘅標準警告。）
7. 複製 **Web app URL**（以 `/exec` 結尾）。

> 之後如果改咗 Code.gs，要 **Deploy → Manage deployments → 鉛筆 → Version: New version → Deploy**，URL 唔會變。

### 第 2 步：填入 config.js

打開 `config.js`，將 URL 貼入引號入面：

```js
window.VFLOW_SHEET_API = "https://script.google.com/macros/s/XXXXXXXX/exec";
```

### 第 3 步：放上 GitHub

1. GitHub 開一個新 repo（例如 `vflow-quiz`）。**建議 Private**：題庫係內部資料。
   - Private repo 都可以開 GitHub Pages，但要 GitHub Pro／Team 或者 organization plan；Free plan 嘅 Private repo 開唔到 Pages。
   - 如果一定要 Public repo：頁面有密碼閘，但識睇 source 嘅人可以睇到題目同密碼 hash。
2. 將呢個資料夾入面所有嘢上載（網頁版可以直接 **Add file → Upload files**，拖晒入去，包括 `assets` 同 `apps-script` 資料夾）。
3. Repo **Settings → Pages**：
   - Source：**Deploy from a branch**
   - Branch：`main`，folder：`/ (root)` → Save
4. 等一兩分鐘，Pages 會顯示網址：`https://<你嘅帳號>.github.io/vflow-quiz/`

### 第 4 步：試一局

1. 開網址，入名同密碼（預設 `TopGlow2026`）。
2. 玩一局 10 題。
3. 返去 Google Sheet：會自動出現兩個分頁 — `log`（每局一行）同 `board`（每人彙總）。
4. 網頁底部排行榜應該見到你個名。

## 改密碼

密碼唔係明文存，係 SHA-256 hash。要改：

1. 喺任何瀏覽器 console 行：
   ```js
   crypto.subtle.digest("SHA-256", new TextEncoder().encode("新密碼")).then(h=>console.log([...new Uint8Array(h)].map(x=>x.toString(16).padStart(2,"0")).join("")))
   ```
2. 將印出嚟嘅 64 位 hex 取代 `index.html` 入面 `const GATE_HASH="…"` 嗰個值。

## 改題目

題庫喺 `index.html` 入面 `const BANKS = {…}`。每題格式：

```
[分類索引, 難度(1/2/3), 題目, 正確答案, 錯誤答案, 解釋, 實際點做]
```

分類索引對應各題庫上面嘅 `cats` 名單。改完上載覆蓋 `index.html` 就得。

## 排行榜點計

- 初級每題 1 分、中級 2 分、高級 3 分，答對先有分，每局累積。
- 同一個名（唔分大小寫）會合併計。
- `board` 分頁可以直接手動改或者刪行（例如有人亂入名），下次載入就會反映。
- 想重置：刪走 `log` 同 `board` 兩個分頁，下一局會自動重建。

## 注意

- 排行榜靠 Google Apps Script，第一次載入可能慢 1–2 秒。
- 同一部機入過名同密碼之後會記住；換名就清 localStorage 或者用無痕。
- 影片喺 iOS 低電量模式可能唔會自動播，會顯示 poster 相。
