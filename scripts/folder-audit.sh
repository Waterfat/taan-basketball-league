#!/bin/bash
# folder-audit.sh — 專案資料夾結構審計
# 基於 docs/project-structure.md Canon 定義做正面驗證
# 被 .git/hooks/pre-commit 呼叫，也可手動執行

set -e

VIOLATIONS=0
ROOT="$(git rev-parse --show-toplevel 2>/dev/null || echo '.')"

# ─── 規則 1：根目錄只允許 Canon 清單內的非隱藏目錄 ──────────────────────
# 隱藏目錄（.開頭）為工具/系統目錄，gitignored，不在 Canon 管控範圍
ALLOWED_ROOT_DIRS="src public docs scripts tests gas data .github"
for dir in "$ROOT"/*/; do
  [ -d "$dir" ] || continue
  name=$(basename "$dir")
  [[ "$name" == .* ]] && continue
  git check-ignore -q "$dir" 2>/dev/null && continue
  if ! echo "$ALLOWED_ROOT_DIRS" | grep -qw "$name"; then
    echo "❌ [folder-audit] 根目錄出現未知目錄：$name"
    echo "   Canon 允許清單：$ALLOWED_ROOT_DIRS"
    echo "   若要新增，請同步更新 scripts/folder-audit.sh + docs/project-structure.md"
    VIOLATIONS=$((VIOLATIONS+1))
  fi
done

# ─── 規則 2：根目錄不允許非程式碼雜訊檔案 ────────────────────────────────
ROOT_NOISE=$(find "$ROOT" -maxdepth 1 -type f \( -name "*.png" -o -name "*.log" -o -name "*.tmp" -o -name "*.sql" -o -name "*.jpg" -o -name "*.jpeg" \) 2>/dev/null | grep -v ".git" | head -10)
if [ -n "$ROOT_NOISE" ]; then
  echo "❌ [folder-audit] 根目錄有非程式碼雜訊："
  echo "$ROOT_NOISE" | while read -r f; do echo "   $f"; done
  echo "   截圖 → .claude-output/screenshots/，資料匯出 → .claude-output/exports/"
  VIOLATIONS=$((VIOLATIONS+1))
fi

# ─── 規則 3：web/tests/e2e/ 只允許 Canon 清單內的子目錄 ──────────────────
ALLOWED_E2E="features regression setup helpers .auth"
if [ -d "$ROOT/tests/e2e" ]; then
  for dir in "$ROOT/tests/e2e"/*/; do
    [ -d "$dir" ] || continue
    name=$(basename "$dir")
    if ! echo "$ALLOWED_E2E" | grep -qw "$name"; then
      echo "❌ [folder-audit] 未知目錄：tests/e2e/$name"
      echo "   允許清單：$ALLOWED_E2E"
      echo "   若要新增合法目錄，請更新 scripts/folder-audit.sh 的 ALLOWED_E2E"
      VIOLATIONS=$((VIOLATIONS+1))
    fi
  done
fi

# ─── 規則 4：.claude-output/ 超過 7 天舊檔提示 ───────────────────────────
if [ -d "$ROOT/.claude-output" ]; then
  OLD_COUNT=$(find "$ROOT/.claude-output" -type f -mtime +7 2>/dev/null | wc -l | tr -d ' ')
  if [ "$OLD_COUNT" -gt 0 ]; then
    echo "⚠️  [folder-audit] .claude-output/ 有 ${OLD_COUNT} 個超過 7 天的舊檔"
    echo "   執行清理：find .claude-output -mtime +7 -type f -delete"
    VIOLATIONS=$((VIOLATIONS+1))
  fi
fi

# ─── 結果 ─────────────────────────────────────────────────────────────────
if [ "$VIOLATIONS" -gt 0 ]; then
  echo ""
  echo "🛑 folder-audit 失敗（$VIOLATIONS 個問題）"
  echo "   參考：docs/project-structure.md"
  exit 1
fi

echo "✅ folder-audit 通過"
exit 0
