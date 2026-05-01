# 第三方整合

## Google Apps Script Webapp（主資料源）

| 欄位 | 內容 |
|------|------|
| 用途 | 球員 / 賽程 / 戰績 / 統計資料的中央資料源 |
| 文件 | <https://developers.google.com/apps-script/guides/web> |
| 程式碼 | `gas/Code.gs`（本 repo 內，獨立部署到 Google Apps Script） |
| 費用 | 免費 |
| 部署方式 | Apps Script Editor → 部署 → 新增部署 → Web App → 任何人可存取 |
| 部署後產出 | `https://script.google.com/macros/s/{DEPLOY_ID}/exec` |
| 寫入 .env | `PUBLIC_GAS_WEBAPP_URL` |
| 限制 | GAS daily quota：20,000 calls/day（已知），URLFetch 限 100,000/day |
| Fallback | 失敗時讀 `public/data/*.json` |
| 改動流程 | 改 `gas/Code.gs` → Apps Script Editor 貼上 → 重新部署（產生新版本） |

### 為什麼選 GAS

- 球賽資料統一由聯盟管理員在 Google Sheets 維護，無需另建後端
- 公開讀取無需認證，符合靜態網站需求
- 完全免費，daily quota 對社區聯盟綽綽有餘

### 重新部署檢查

每次改 `gas/Code.gs` 後：
1. 在 Apps Script Editor 選「管理部署」
2. 編輯 active deployment → 版本選「新版本」
3. 部署後**保留同一個 URL**（不會變）
4. 本地 `.env.local` 不需改

## 未來可能整合（已記錄不 scaffold）

- **Sentry**：錯誤追蹤（若觀察到使用者回報問題增加再評估）
- **Plausible / Umami**：訪客分析（GH Pages 友善）
- **OAuth**：若加會員系統（球員自己登入查個人數據）→ 那時用 `Skill("auth")` 處理
