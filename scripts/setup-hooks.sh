#!/bin/bash
# setup-hooks.sh — 安裝 git hooks（clone 後執行一次）
# Usage: bash scripts/setup-hooks.sh

HOOK_DIR="$(git rev-parse --show-toplevel)/.git/hooks"
SCRIPT_DIR="$(dirname "$0")"

cat > "$HOOK_DIR/pre-commit" << 'EOF'
#!/bin/bash
bash "$(git rev-parse --show-toplevel)/scripts/folder-audit.sh"
EOF

chmod +x "$HOOK_DIR/pre-commit"
echo "✅ pre-commit hook 已安裝（folder-audit.sh）"
