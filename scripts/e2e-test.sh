#!/bin/bash
# =============================================================
# 通用 E2E Test Runner（專案內 scripts/e2e-test.sh 的範本）
#
# 用法:
#   ./scripts/e2e-test.sh [BASE_URL]
#   E2E_USERNAME=admin E2E_PASSWORD=secret ./scripts/e2e-test.sh
#
# 新專案使用步驟:
#   1. cp ~/.claude/scripts/e2e-test.example.sh scripts/e2e-test.sh
#   2. chmod +x scripts/e2e-test.sh
#   3. 修改下方 DEFAULT_URL
#   4. 建立 playwright.config.ts 和 e2e/ 目錄的測試檔
# =============================================================

set -euo pipefail

# ── 專案設定（每個專案修改這裡） ──────────────────────────────
DEFAULT_URL="https://your-app.vercel.app"
# ─────────────────────────────────────────────────────────────

REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$REPO_ROOT"

# ── Base URL ──────────────────────────────────────────────────
if [ -n "${1:-}" ]; then
  export BASE_URL="$1"
fi
BASE_URL="${BASE_URL:-$DEFAULT_URL}"

# ── Check Playwright is installed ─────────────────────────────
if ! npx playwright --version &>/dev/null; then
  echo "Playwright not found. Installing..."
  npm install --save-dev @playwright/test
  npx playwright install chromium
fi

# ── 檢查帳密：無帳密時詢問而非跳過 ────────────────────────────
if [ -z "${E2E_USERNAME:-}" ] || [ -z "${E2E_PASSWORD:-}" ]; then
  echo ""
  echo "⚠ E2E_USERNAME / E2E_PASSWORD 未設定，後台測試需要登入帳密。"
  echo ""
  read -rp "是否輸入帳密以執行後台測試？(y/N) " answer
  if [[ "$answer" =~ ^[Yy]$ ]]; then
    read -rp "E2E_USERNAME: " E2E_USERNAME
    read -rsp "E2E_PASSWORD: " E2E_PASSWORD
    echo ""
    export E2E_USERNAME E2E_PASSWORD
  else
    echo ""
    echo "跳過後台測試，僅執行公開頁面與認證流程測試。"
    echo ""
  fi
fi

# ── Run tests ─────────────────────────────────────────────────
echo ""
echo "========================================"
echo "Playwright E2E Tests"
echo "  BASE_URL : $BASE_URL"
echo "  Auth     : ${E2E_USERNAME:+credentials set}${E2E_USERNAME:-skipped (admin tests excluded)}"
echo "========================================"
echo ""

BASE_URL="$BASE_URL" npx playwright test "${@:2}"

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
  printf "\033[32mAll E2E tests passed.\033[0m\n"
else
  printf "\033[31mSome E2E tests failed. See e2e-results/ for details.\033[0m\n"
fi

exit $EXIT_CODE
