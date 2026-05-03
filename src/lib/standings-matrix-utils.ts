import type { MatrixCell } from '../types/standings';

/**
 * 戰績矩陣 cell 顯示工具（Issue #14 Task 5 / U-201 + U-202）
 *
 * cell 含義：
 *  - null：對角線（自己對自己），畫面顯示「—」
 *  - 正數：該列隊伍對該欄隊伍累計淨勝分，CSS class 為 matrix-cell--positive
 *  - 負數：該列隊伍輸的累計分，CSS class 為 matrix-cell--negative
 *  - 0：平手累計，CSS class 為 matrix-cell--zero
 */

export type MatrixCellSign = 'self' | 'positive' | 'negative' | 'zero';

/**
 * 判斷 cell 顯示分類（self / positive / negative / zero）。
 * @param cell 矩陣 cell（number | null）
 */
export function getCellSign(cell: MatrixCell): MatrixCellSign {
  if (cell === null) return 'self';
  if (cell > 0) return 'positive';
  if (cell < 0) return 'negative';
  return 'zero';
}

/**
 * 取得 cell 對應的 CSS utility class（樣式定義在 src/styles/global.css）。
 */
export function getCellClass(cell: MatrixCell): string {
  return `matrix-cell--${getCellSign(cell)}`;
}

/**
 * 取得 cell 顯示文字：
 *  - null → 「—」（U+2014 em dash）
 *  - 正數 → 「+N」（加 + 號便於閱讀）
 *  - 0 / 負數 → 直接 String(n)
 */
export function formatCellText(cell: MatrixCell): string {
  if (cell === null) return '—';
  if (cell > 0) return `+${cell}`;
  return String(cell);
}
