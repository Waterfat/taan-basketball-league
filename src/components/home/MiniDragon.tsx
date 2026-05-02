import type { DragonEntry } from '../../types/home';
import { limitTop } from '../../lib/home-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface Props {
  dragonTop10: DragonEntry[];
  baseUrl: string;
}

export function MiniDragon({ dragonTop10, baseUrl }: Props) {
  const top5 = limitTop(dragonTop10, 5);
  const href = `${baseUrl.replace(/\/$/, '')}/roster?tab=dragon`;
  return (
    <section
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
      data-testid="home-dragon"
    >
      <h2 className="font-condensed font-bold text-navy text-lg mb-3">🐉 龍虎榜</h2>

      {/* Mobile：compact rows */}
      <div className="md:hidden space-y-2">
        {top5.map((entry) => {
          const color = TEAM_CONFIG[entry.team]?.color ?? '#999';
          return (
            <div
              key={entry.rank}
              data-testid="dragon-row"
              className="flex items-center gap-2 border-b border-warm-1 last:border-0 py-1.5"
            >
              <span data-testid="rank" className="text-xs text-txt-mid w-4">{entry.rank}</span>
              <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: color }} />
              <span data-testid="name" className="font-bold text-sm text-navy flex-1">{entry.name}</span>
              <span data-testid="team" className="text-xs text-txt-mid">{entry.team}</span>
              <span data-testid="total" className="text-sm font-condensed text-orange">{entry.total}</span>
            </div>
          );
        })}
      </div>

      {/* Desktop：table */}
      <div className="hidden md:block">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-txt-mid border-b border-warm-2">
              <th className="text-left py-1 w-6">#</th>
              <th className="text-left py-1">名</th>
              <th className="text-left py-1">隊</th>
              <th className="text-right py-1">總分</th>
            </tr>
          </thead>
          <tbody>
            {top5.map((entry) => {
              const color = TEAM_CONFIG[entry.team]?.color ?? '#999';
              return (
                <tr key={entry.rank} data-testid="dragon-row" className="border-b border-warm-1 last:border-0">
                  <td className="py-1.5"><span data-testid="rank" className="text-txt-mid">{entry.rank}</span></td>
                  <td className="py-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
                      <span data-testid="name" className="font-bold text-navy">{entry.name}</span>
                    </div>
                  </td>
                  <td className="py-1.5"><span data-testid="team">{entry.team}</span></td>
                  <td className="py-1.5 text-right"><span data-testid="total" className="text-orange font-condensed">{entry.total}</span></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 text-right">
        <a href={href} className="text-sm font-bold text-orange hover:underline">
          看完整龍虎榜 →
        </a>
      </div>
    </section>
  );
}
