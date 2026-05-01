# 大安ㄍㄤㄍㄤ好籃球聯盟

社區業餘籃球聯盟官方網站。展示賽程、戰績、球員名單、龍虎榜、數據統計、輪值排班、歷史賽季與名人堂。

🌐 **線上網址**：<https://waterfat.github.io/taan-basketball-league/>

## 技術棧

- **框架**：Astro 6（multi-page、Zero JS by default）
- **樣式**：Tailwind CSS 4
- **語言**：TypeScript（strict）
- **資料**：Google Apps Script Webapp（主）+ 靜態 JSON（fallback）
- **測試**：Vitest（unit）+ Playwright（E2E）
- **部署**：GitHub Pages（GitHub Actions 自動）
- **PWA**：manifest.json + Service Worker

## 環境變數

複製 `.env.example` 為 `.env.local`，填入：

| 變數 | 說明 |
|------|------|
| `PUBLIC_GAS_WEBAPP_URL` | Google Apps Script webapp 部署網址（資料來源） |
| `PUBLIC_SITE_URL` | 部署網址（用於 sitemap / canonical / OG） |

## 啟動指令

```bash
npm install              # 安裝依賴
npm run dev              # localhost:4321 啟動 dev server
npm run build            # build 到 dist/
npm run preview          # 預覽 build 結果
npm test                 # Vitest 單元測試
npm run test:e2e         # Playwright E2E
npm run lint             # astro check（型別檢查）
npm run audit:folders    # 資料夾結構審計
```

## 部署

push `main` → GitHub Actions（`.github/workflows/deploy.yml`）
- 跑 `npm test` + `npm run lint`
- `npm run build`
- 推 `dist/` 到 `gh-pages` branch
- GitHub Pages 自動 serve

## 資料來源更新

- **球員 / 賽程 / 戰績** → 改 Google Sheets（GAS webapp 自動讀取）
- **靜態 fallback JSON** → 改 `public/data/*.json`
- **隊伍配色** → 改 `src/config/teams.ts`

## 文件位置

| 文件 | 路徑 |
|------|------|
| 專案規則 | `CLAUDE.md` |
| 資料夾規範 | `docs/project-structure.md` |
| 部署設定 | `docs/ops/deploy-config.yml` |
| 第三方整合 | `docs/specs/integrations.md` |
| 測試規範 | `tests/TESTING.md` |
| 網站內容規劃書 | `docs/research/網站內容規劃書.md` |

## License

MIT
