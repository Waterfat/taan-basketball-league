// src/components/boxscore/LeaderCard.tsx
import type { LeaderCategory, LeaderEntry } from '../../types/leaders';
import { getTeam } from '../../config/teams';
import { formatScoringAdvanced, formatReboundAdvanced } from '../../lib/leaders-format';
import { LeadersEmpty } from './LeadersEmpty';

const CATEGORY_TITLES: Record<LeaderCategory, string> = {
  scoring: '得分王',
  rebound: '籃板王',
  assist: '助攻王',
  steal: '抄截王',
  block: '阻攻王',
  eff: '效率王',
};

interface Props {
  category: LeaderCategory;
  entries: LeaderEntry[];
}

export function LeaderCard({ category, entries }: Props) {
  return (
    <div
      data-testid="leaders-card"
      data-category={category}
      className="bg-white border border-warm-2 rounded-2xl p-4"
    >
      <h3 className="font-condensed text-lg text-navy mb-3 font-bold">
        {CATEGORY_TITLES[category]}
      </h3>
      {entries.length === 0 ? (
        <LeadersEmpty message="該類別尚無數據" />
      ) : (
        <ol className="space-y-2">
          {entries.slice(0, 10).map((e, idx) => {
            const rank = idx + 1;
            const team = getTeam(e.team);
            const advanced =
              category === 'scoring'
                ? formatScoringAdvanced(e)
                : category === 'rebound'
                  ? formatReboundAdvanced(e)
                  : null;
            return (
              <li
                key={`${rank}-${e.name}`}
                data-testid="leader-row"
                data-rank={rank}
                className="flex items-center gap-2 text-sm"
              >
                <span className="w-6 font-bold text-txt-light">{rank}</span>
                <span
                  data-testid="leader-team-dot"
                  data-team={e.team}
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: team?.color ?? '#999' }}
                  aria-hidden="true"
                />
                <span data-testid="leader-name" className="flex-1 text-txt-dark">{e.name}</span>
                <span data-testid="leader-val" className="font-condensed font-bold text-orange">
                  {e.val.toFixed(2)}
                </span>
                {advanced && (
                  <span data-testid="leader-advanced" className="text-xs text-txt-mid hidden md:inline">
                    {advanced}
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}
