import type { MiniStatCategory } from '../../types/home';
import { limitTop } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  miniStats: { pts: MiniStatCategory; reb: MiniStatCategory; ast: MiniStatCategory };
  baseUrl: string;
}

function StatCategory({ cat }: { cat: MiniStatCategory }) {
  const top3 = limitTop(cat.players, 3);
  return (
    <div className="flex-1 min-w-0" data-testid="leader-category">
      <h3 className="text-xs font-bold text-txt-mid mb-2 uppercase tracking-wide">
        {cat.label} {cat.unit}
      </h3>
      <div className="space-y-1">
        {top3.map((player) => {
          const color = TEAM_CONFIG[player.team]?.color ?? '#999';
          return (
            <div
              key={`${player.name}-${player.rank}`}
              className="flex items-center gap-1.5"
              data-testid="leader-entry"
            >
              <span className="text-xs text-txt-mid w-4">{player.rank}</span>
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span data-testid="leader-name" className="text-sm font-bold text-navy truncate flex-1">{player.name}</span>
              <span className="text-sm text-orange font-condensed shrink-0">{player.val}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function MiniLeaders({ miniStats, baseUrl }: Props) {
  const href = `${baseUrl.replace(/\/$/, '')}/boxscore?tab=leaders`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-leaders"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">📊 領先榜</h2>
      {/* 三指標橫排（md 以上），直排（mobile） */}
      <div className="flex flex-col md:flex-row gap-4">
        <StatCategory cat={miniStats.pts} />
        <StatCategory cat={miniStats.reb} />
        <StatCategory cat={miniStats.ast} />
      </div>
      <div className="mt-3 text-right">
        <a href={href} className="text-sm font-bold text-orange hover:underline">
          看完整領先榜 →
        </a>
      </div>
    </section>
  );
}
