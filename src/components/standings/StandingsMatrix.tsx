/**
 * StandingsMatrix — 對戰勝敗矩陣（Issue #14 Task 5 / B-3 / AC-E1 / BQ-1）
 *
 * 顯示 6×6 隊際淨勝分矩陣：
 *  - 對角線（自己對自己）→ 「—」+ matrix-cell--self
 *  - 正數淨勝分 → 「+N」+ matrix-cell--positive（綠）
 *  - 負數淨勝分 → 「-N」+ matrix-cell--negative（紅）
 *  - 0 → 「0」+ matrix-cell--zero（中性）
 *
 * RWD 規則例外（style-rwd-list deviation）：
 *   一般「多欄位列表」要求 PC 用 table、mobile 拆 card；本元件因為 cell value 短
 *   （±15 內、最多 3 字元），且 6×6 grid 拆 card 後資訊量反而難讀，所以
 *   PC/mobile 都用 <table> + overflow-x-auto 橫向捲動。手機 viewport 下
 *   min-w-[500px] 確保 scrollWidth > clientWidth，達成 E-204 驗收。
 *
 * 三狀態策略（style-skeleton-loading）：
 *   StandingsApp 既有 SkeletonState / ErrorState / EmptyState 已涵蓋整頁三狀態；
 *   matrix 與 standings 同一份 data，只在 ok state 渲染，不另加 skeleton 避免雙重。
 */

import type { MatrixData } from '../../types/standings';
import { TEAM_CONFIG } from '../../config/teams';
import { getCellClass, formatCellText } from '../../lib/standings-matrix-utils';

interface Props {
  matrix: MatrixData;
}

export function StandingsMatrix({ matrix }: Props) {
  return (
    <section
      data-testid="standings-matrix"
      className="px-4 md:px-8 py-6 mt-4"
    >
      <h2 className="font-condensed font-bold text-navy text-lg md:text-xl mb-3">
        對戰勝敗矩陣
      </h2>
      <div
        data-testid="matrix-scroll"
        className="overflow-x-auto rounded-2xl border border-warm-2 bg-white"
      >
        <table
          data-testid="matrix-table"
          className="min-w-[500px] w-full text-sm border-collapse"
        >
          <thead className="bg-warm-1 text-txt-mid">
            <tr>
              <th className="px-3 py-2 text-left font-bold w-16">隊伍</th>
              {matrix.teams.map((t) => {
                const color = TEAM_CONFIG[t]?.color ?? 'var(--color-txt-mid)';
                return (
                  <th
                    key={t}
                    data-testid="matrix-col-header"
                    data-team={t}
                    className="px-3 py-2 text-center font-bold"
                    style={{ color }}
                  >
                    {t}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {matrix.teams.map((rowTeam, i) => {
              const rowColor = TEAM_CONFIG[rowTeam]?.color ?? 'var(--color-txt-mid)';
              const rowResults = matrix.results[i] ?? [];
              return (
                <tr key={rowTeam} className="border-t border-warm-2">
                  <th
                    scope="row"
                    data-testid="matrix-row-header"
                    data-team={rowTeam}
                    className="px-3 py-2 text-left font-bold bg-warm-1/50"
                    style={{ color: rowColor }}
                  >
                    {rowTeam}
                  </th>
                  {rowResults.map((cell, j) => {
                    const colTeam = matrix.teams[j] ?? '';
                    return (
                      <td
                        key={`${rowTeam}-${colTeam}-${j}`}
                        data-testid="matrix-cell"
                        data-row={rowTeam}
                        data-col={colTeam}
                        data-net-points={cell ?? ''}
                        className={`matrix-cell ${getCellClass(cell)} px-3 py-2 text-center font-condensed font-bold`}
                      >
                        {formatCellText(cell)}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="mt-2 text-xs text-txt-light">
        橫排為「該列隊伍」，縱排為「對手」；數字為累計淨勝分（+ 為勝出、- 為落後）。
      </p>
    </section>
  );
}
