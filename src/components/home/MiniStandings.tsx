import type { HomeStandingTeam } from '../../types/home';
import { getStreakStyle } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  teams: HomeStandingTeam[];
  baseUrl: string;
}

function teamDotStyle(teamId: string) {
  const config = TEAM_CONFIG[teamId];
  return { backgroundColor: config?.color ?? '#999' };
}

function buildRosterHref(baseUrl: string, teamId: string) {
  const config = TEAM_CONFIG[teamId];
  return `${baseUrl.replace(/\/$/, '')}/roster?team=${config?.id ?? teamId}`;
}

function StreakCell({ team }: { team: HomeStandingTeam }) {
  const { colorClass, arrow } = getStreakStyle(team.streakType);
  return (
    <span
      data-testid="streak"
      data-streak-type={team.streakType ?? ''}
      className={`font-condensed text-sm ${colorClass}`}
    >
      {team.streak}
      {arrow ? <span data-testid="streak-icon" aria-hidden="true"> {arrow}</span> : null}
    </span>
  );
}

export function MiniStandings({ teams, baseUrl }: Props) {
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-standings"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">🏆 戰績榜</h2>

      {/* Mobile：compact rows（整列可點） */}
      <div className="md:hidden space-y-2">
        {teams.map((team) => (
          <a
            key={team.team}
            href={buildRosterHref(baseUrl, team.team)}
            data-testid="home-standings-row"
            className="flex items-center justify-between py-1.5 border-b border-warm-1 last:border-0 hover:bg-warm-1 rounded px-1 transition"
            aria-label={`${team.name} 第 ${team.rank} 名`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span data-testid="rank" className="text-xs text-txt-mid w-4 shrink-0">{team.rank}</span>
              <span data-testid="team-dot" className="w-2.5 h-2.5 rounded-full shrink-0" style={teamDotStyle(team.team)} />
              <span data-testid="team-name" className="font-bold text-sm text-navy truncate">{team.name}</span>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <span data-testid="record" className="text-xs text-txt-mid">{team.record}</span>
              <StreakCell team={team} />
            </div>
          </a>
        ))}
      </div>

      {/* Desktop：table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-txt-mid border-b border-warm-2">
              <th className="text-left py-1 w-6">#</th>
              <th className="text-left py-1">隊伍</th>
              <th className="text-left py-1">勝敗</th>
              <th className="text-left py-1">勝率</th>
              <th className="text-left py-1">連勝</th>
            </tr>
          </thead>
          <tbody>
            {teams.map((team) => (
              <tr
                key={team.team}
                data-testid="home-standings-row"
                className="border-b border-warm-1 last:border-0 hover:bg-warm-1 transition"
              >
                <td className="py-1.5"><span data-testid="rank" className="text-txt-mid">{team.rank}</span></td>
                <td className="py-1.5">
                  <a
                    href={buildRosterHref(baseUrl, team.team)}
                    className="flex items-center gap-1.5 hover:text-orange"
                  >
                    <span data-testid="team-dot" className="w-2.5 h-2.5 rounded-full" style={teamDotStyle(team.team)} />
                    <span data-testid="team-name" className="font-bold text-navy">{team.name}</span>
                  </a>
                </td>
                <td className="py-1.5"><span data-testid="record">{team.record}</span></td>
                <td className="py-1.5"><span data-testid="pct">{team.pct}</span></td>
                <td className="py-1.5"><StreakCell team={team} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <a
          href={`${baseUrl.replace(/\/$/, '')}/standings`}
          className="text-sm font-bold text-orange hover:underline"
        >
          看完整戰績 →
        </a>
      </div>
    </section>
  );
}
