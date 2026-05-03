/**
 * 出席符號說明 legend（球員名單 tab 上方）
 *
 * 對應 E-503 (B-7.1)：legend 顯示「1 出席、0 請假、✕ 曠賽、? 尚未舉行」
 *
 * 注意：fixture 中 att 值為 'x'，但 legend 顯示用全形「✕」符號（U+2715），
 * 兩者皆需在 legend 文字中出現以滿足 E2E `toContainText('✕')` 與 `toContainText('?')`。
 */
export function AttendanceLegend() {
  return (
    <section
      data-testid="attendance-legend"
      className="px-4 md:px-8 mb-3 text-xs text-txt-mid"
    >
      <span className="font-medium">出席符號說明：</span>
      <span className="ml-3 inline-flex items-center gap-1">
        <span className="font-bold text-txt-dark">1</span>
        <span>出席</span>
      </span>
      <span className="ml-3 inline-flex items-center gap-1">
        <span className="font-bold text-txt-dark">0</span>
        <span>請假</span>
      </span>
      <span className="ml-3 inline-flex items-center gap-1">
        <span className="font-bold text-txt-dark">✕</span>
        <span>曠賽</span>
      </span>
      <span className="ml-3 inline-flex items-center gap-1">
        <span className="font-bold text-txt-dark">?</span>
        <span>尚未舉行</span>
      </span>
    </section>
  );
}
