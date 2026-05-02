// src/components/boxscore/BoxscoreTeamTable.tsx
import type { BoxscoreTeam, BoxscorePlayer } from '../../types/boxscore';
import { getTeam } from '../../config/teams';

// 11 欄 = 球員 + 10 個數據（pts, fg2, fg3, ft, treb, ast, stl, blk, tov, pf）→ 共 11 = 1 名 + 10 stats
// 但 spec E-13 算法：以 columns row 第一格 + 10 個 stat header → 11 個 <th>
// （oreb/dreb 為 treb 的細分，不算入 11 欄主表，可以放展開或合併）
//
// 改為以下 11 欄主表：球員 / 得分 / 2P / 3P / FT / TREB / AST / STL / BLK / TOV / PF
// 進階（OREB/DREB）藏在 expand 或 sub-row（Issue 規格未強制）

const MAIN_COLUMNS = [
  { key: 'name', label: '球員' },
  { key: 'pts', label: '得分' },
  { key: 'fg2', label: '2P' },
  { key: 'fg3', label: '3P' },
  { key: 'ft', label: 'FT' },
  { key: 'treb', label: 'TREB' },
  { key: 'ast', label: 'AST' },
  { key: 'stl', label: 'STL' },
  { key: 'blk', label: 'BLK' },
  { key: 'tov', label: 'TOV' },
  { key: 'pf', label: 'PF' },
] as const;

interface Props {
  team: BoxscoreTeam;
}

export function BoxscoreTeamTable({ team }: Props) {
  const config = getTeam(team.team);
  return (
    <div className="overflow-x-auto -mx-4 md:mx-0 px-4 md:px-0 scrollbar-thin">
      <table
        data-testid="bs-team-table"
        data-team={team.team}
        className="w-full min-w-[640px] text-sm border-collapse"
      >
        <thead>
          <tr className="border-b border-warm-2 text-txt-mid">
            {MAIN_COLUMNS.map((col) => (
              <th key={col.key} className="text-left px-2 py-2 font-condensed font-bold whitespace-nowrap">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {team.players.map((p) => (
            <tr
              key={p.name}
              data-testid="bs-player-row"
              data-dnp={p.dnp}
              className={[
                'border-b border-warm-1',
                p.dnp ? 'text-gray-400 italic' : 'text-txt-dark',
              ].join(' ')}
            >
              <td className="px-2 py-2 whitespace-nowrap">
                {p.name}
                {p.dnp && <span className="ml-1 text-xs">(未出賽)</span>}
              </td>
              {MAIN_COLUMNS.slice(1).map((col) => (
                <td key={col.key} className="px-2 py-2">{p[col.key as keyof BoxscorePlayer] as number}</td>
              ))}
            </tr>
          ))}
          <tr
            data-testid="bs-totals-row"
            className="border-t-2 border-warm-2 font-bold"
            style={config ? { color: config.textColor } : undefined}
          >
            <td className="px-2 py-2">合計</td>
            <td className="px-2 py-2">{team.totals.pts}</td>
            <td className="px-2 py-2">{team.totals.fg2}</td>
            <td className="px-2 py-2">{team.totals.fg3}</td>
            <td className="px-2 py-2">{team.totals.ft}</td>
            <td className="px-2 py-2">{team.totals.treb}</td>
            <td className="px-2 py-2">{team.totals.ast}</td>
            <td className="px-2 py-2">{team.totals.stl}</td>
            <td className="px-2 py-2">{team.totals.blk}</td>
            <td className="px-2 py-2">{team.totals.tov}</td>
            <td className="px-2 py-2">{team.totals.pf}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
