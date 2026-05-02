// src/components/standings/StandingsRow.tsx
import type { TeamStanding } from '../../types/standings';
import {
  buildRosterLink,
  getHistoryDotColor,
  getStreakClasses,
} from '../../lib/standings-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  team: TeamStanding;
  baseUrl: string;
}

function HistoryDots({ team, history }: { team: string; history: TeamStanding['history'] }) {
  return (
    <div data-testid="history" className="flex gap-1">
      {history.map((r, i) => (
        <span
          key={i}
          data-testid="history-dot"
          data-result={r}
          className="w-2.5 h-2.5 rounded-full inline-block"
          style={{ backgroundColor: getHistoryDotColor(r, team) }}
          aria-label={r === 'W' ? '勝' : '敗'}
        />
      ))}
    </div>
  );
}

function StreakLabel({ team }: { team: TeamStanding }) {
  const { colorClass, arrow } = getStreakClasses(team.streakType);
  return (
    <span
      data-testid="streak"
      data-streak-type={team.streakType}
      className={`font-condensed text-sm ${colorClass}`}
    >
      {team.streak}
      {arrow && <span aria-hidden="true"> {arrow}</span>}
    </span>
  );
}

function rowAriaLabel(t: TeamStanding) {
  return `${t.name} 第 ${t.rank} 名 ${t.wins} 勝 ${t.losses} 敗`;
}

/** Mobile card 模式 */
export function StandingsCard({ team, baseUrl }: Props) {
  const config = TEAM_CONFIG[team.team];
  const href = `${baseUrl.replace(/\/$/, '')}${buildRosterLink(team.team)}`;
  return (
    <a
      href={href}
      data-testid="standings-row"
      aria-label={rowAriaLabel(team)}
      className="block bg-white border border-warm-2 rounded-2xl p-4 hover:border-orange transition"
    >
      <div className="flex items-center gap-3 mb-3">
        <span data-testid="rank" className="font-display text-2xl text-txt-dark w-8">
          {team.rank}
        </span>
        <span
          data-testid="team-dot"
          className="w-3 h-3 rounded-full"
          style={{ backgroundColor: config?.color ?? '#999' }}
        />
        <span data-testid="team-name" className="font-bold text-lg">
          {team.team}
        </span>
        <span className="ml-auto"><StreakLabel team={team} /></span>
      </div>
      <div className="flex items-center gap-4 text-sm text-txt-mid">
        <span><span data-testid="wins" className="font-bold text-txt-dark">{team.wins}</span> 勝</span>
        <span><span data-testid="losses" className="font-bold text-txt-dark">{team.losses}</span> 敗</span>
        <span data-testid="pct" className="font-condensed">{team.pct}</span>
        <span className="ml-auto"><HistoryDots team={team.team} history={team.history} /></span>
      </div>
    </a>
  );
}

/** Desktop table row 模式 */
export function StandingsTableRow({ team, baseUrl }: Props) {
  const config = TEAM_CONFIG[team.team];
  const href = `${baseUrl.replace(/\/$/, '')}${buildRosterLink(team.team)}`;
  return (
    <tr
      data-testid="standings-row"
      onClick={() => { window.location.href = href; }}
      role="link"
      aria-label={rowAriaLabel(team)}
      className="cursor-pointer hover:bg-warm-1 transition border-b border-warm-2"
    >
      <td data-testid="rank" className="font-display text-2xl px-4 py-3">{team.rank}</td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <span
            data-testid="team-dot"
            className="w-3 h-3 rounded-full"
            style={{ backgroundColor: config?.color ?? '#999' }}
          />
          <span data-testid="team-name" className="font-bold">{team.team}</span>
        </div>
      </td>
      <td data-testid="wins" className="px-4 py-3 font-condensed">{team.wins}</td>
      <td data-testid="losses" className="px-4 py-3 font-condensed">{team.losses}</td>
      <td data-testid="pct" className="px-4 py-3 font-condensed">{team.pct}</td>
      <td className="px-4 py-3"><HistoryDots team={team.team} history={team.history} /></td>
      <td className="px-4 py-3"><StreakLabel team={team} /></td>
    </tr>
  );
}
