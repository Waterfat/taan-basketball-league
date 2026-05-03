// src/components/boxscore/TeamLeadersSection.tsx
import type { LeaderSeason, TeamLeaderTable } from '../../types/leaders';
import { getTeam } from '../../config/teams';

/**
 * 隊伍三表（offense / defense / net）顯示區塊。
 *
 * Covers:
 *   E-401 (B-5.1): 三張表 wrapper + emoji 標題
 *   E-402 (B-5.1): 每張表 6 列 + table 結構
 *   E-403 (BQ-2):  缺一張表（headers/rows 為空）→ 顯示空狀態，不影響其他表
 *
 * Style：
 *   style-rwd-list — `grid-cols-1 md:grid-cols-3` mobile 單欄；表格內 `overflow-x-auto`
 *   style-skeleton-loading — 不另加 skeleton（與 LeadersPanel 同步顯示）
 */

type TableKey = 'offense' | 'defense' | 'net';

interface TableMeta {
  key: TableKey;
  label: string;
  testid: string;
}

const TABLE_META: TableMeta[] = [
  { key: 'offense', label: '⚔️ 隊伍進攻', testid: 'team-leaders-offense' },
  { key: 'defense', label: '🛡️ 隊伍防守', testid: 'team-leaders-defense' },
  { key: 'net', label: '📈 進攻−防守差值', testid: 'team-leaders-net' },
];

interface Props {
  season: LeaderSeason;
}

export function TeamLeadersSection({ season }: Props) {
  return (
    <section
      data-testid="team-leaders-section"
      className="px-4 md:px-8 py-6 grid grid-cols-1 md:grid-cols-3 gap-4"
    >
      {TABLE_META.map(({ key, label, testid }) => (
        <TeamLeaderTableCard
          key={key}
          statKey={key}
          label={label}
          testid={testid}
          table={season[key]}
        />
      ))}
    </section>
  );
}

interface TableCardProps {
  statKey: TableKey;
  label: string;
  testid: string;
  table: TeamLeaderTable | undefined;
}

function TeamLeaderTableCard({ statKey, label, testid, table }: TableCardProps) {
  const isEmpty = !table || table.headers.length === 0 || table.rows.length === 0;
  return (
    <div
      data-testid={testid}
      data-team-stat={statKey}
      className="bg-white border border-warm-2 rounded-2xl p-4"
    >
      <h3 className="font-condensed text-base font-bold text-navy mb-3">{label}</h3>
      {isEmpty ? (
        <div
          data-testid="team-leaders-empty"
          className="text-txt-light text-sm py-6 text-center"
        >
          尚無資料
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table data-testid="team-leaders-table" className="w-full text-sm">
            <thead>
              <tr className="text-txt-mid border-b border-warm-2">
                <th className="text-left py-2 pr-2 font-medium w-8">#</th>
                {table!.headers.map((h, i) => (
                  <th
                    key={`${h}-${i}`}
                    className={`py-2 px-2 font-medium ${i === 0 ? 'text-left' : 'text-right'}`}
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {table!.rows.map((row) => {
                const teamConfig = getTeam(row.team);
                return (
                  <tr
                    key={row.team}
                    data-testid="team-leaders-row"
                    data-team={row.team}
                    className="border-b border-warm-2 last:border-b-0"
                  >
                    <td className="py-2 pr-2 font-bold text-txt-light">{row.rank}</td>
                    <td className="py-2 px-2 text-left">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2.5 h-2.5 rounded-full inline-block flex-shrink-0"
                          style={{ backgroundColor: teamConfig?.color ?? '#999' }}
                          aria-hidden="true"
                        />
                        <span className="font-medium text-txt-dark">{row.team}</span>
                      </span>
                    </td>
                    {row.values.map((v, i) => (
                      <td
                        key={i}
                        className="py-2 px-2 text-right font-condensed text-txt-dark"
                      >
                        {v.toFixed(1)}
                      </td>
                    ))}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
