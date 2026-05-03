# 第三方整合

## Google Sheets API（直打）

新版 v2（Issue #13）後，前端直接打 Google Sheets API v4，移除原 GAS Webapp 中介層。

| 項目 | 值 |
|------|---|
| Endpoint | `https://sheets.googleapis.com/v4/spreadsheets/{ID}/values:batchGet` |
| 認證 | API key 走 `?key=` query param |
| 環境變數 | `PUBLIC_SHEET_ID`, `PUBLIC_SHEETS_API_KEY` |
| Cache | 瀏覽器 in-memory，TTL 5 分鐘（`src/lib/api-cache.ts`）|
| Fallback | `public/data/<kind>.json` 靜態檔 |
| 安全 | API key 在 GCP Console 設 HTTP referrer 限制（`https://waterfat.github.io/*`、`http://localhost:4321/*`）+ API 限制（只開 Sheets API v4）|
| 資料層程式 | `src/lib/api.ts` + `src/lib/api-cache.ts` + `src/lib/api-transforms.ts` |

### 為什麼直打 Sheets API（取代 GAS）

- 移除 GAS Webapp 中介層，少一個部署點，少一層延遲
- 瀏覽器內 5 分鐘 cache 已涵蓋常見讀取模式
- API key + HTTP referrer 限制即可滿足公開讀取的安全需求
- daily quota（Sheets API 100/min/user，500/100s/project）對社區聯盟流量綽綽有餘

### 設定步驟

1. Google Cloud Console → APIs & Services → Credentials → 建立 API Key
2. 「應用程式限制」設為「HTTP referrer」，加入：
   - `https://waterfat.github.io/*`
   - `http://localhost:4321/*`
3. 「API 限制」勾選 Google Sheets API
4. 將 Spreadsheet 共用權限設為「知道連結的人 — 檢視者」
5. 把 SHEET_ID + API_KEY 寫入 `.env.local`（dev）與 GitHub Actions secrets / vars（prod）

### 歷史參考

`gas/Code.gs`、`gas/SETUP.md`、`gas/DATA_SOURCE_CHECKLIST.md` 仍保留在 repo 內當歷史參考，不再實際部署。

## 未來可能整合（已記錄不 scaffold）

- **Sentry**：錯誤追蹤（若觀察到使用者回報問題增加再評估）
- **Plausible / Umami**：訪客分析（GH Pages 友善）
- **OAuth**：若加會員系統（球員自己登入查個人數據）→ 那時用 `Skill("auth")` 處理
