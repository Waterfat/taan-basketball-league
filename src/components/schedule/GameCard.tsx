import { useState } from 'react';
import type { Game } from '../../types/schedule';
import { getWinner, hasStaff } from '../../lib/schedule-utils';

export type MatchupSource = 'combo' | 'order';

const TEAM_COLOR_CLASS: Record<string, string> = {
  紅: 'bg-team-red',
  黑: 'bg-team-black',
  藍: 'bg-team-blue',
  綠: 'bg-team-green',
  黃: 'bg-team-yellow',
  白: 'bg-team-white',
};

const STAFF_LABELS: Record<string, string> = {
  裁判: '裁判',
  場務: '場務',
  攝影: '攝影',
  器材: '器材',
};

interface Props {
  game: Game;
  baseUrl: string;
  /**
   * 控制卡片頂部標籤顯示：
   *  - 'order'（預設）：顯示「場次 N · HH:MM」（賽程順序視圖）
   *  - 'combo'：顯示「對戰 N」（對戰組合視圖，不顯示時間 / 工作人員）
   */
  matchupSource?: MatchupSource;
}

export function GameCard({ game, baseUrl, matchupSource = 'order' }: Props) {
  const [staffOpen, setStaffOpen] = useState(false);
  const winner = getWinner(game);
  const isFinished = game.status === 'finished';
  const isCombo = matchupSource === 'combo';
  const showStaffToggle = !isCombo && hasStaff(game.staff);
  const staffCount = Object.values(game.staff).reduce(
    (n, arr) => n + arr.length,
    0,
  );

  const handleClick = () => {
    if (isFinished) {
      const target = `${baseUrl.replace(/\/$/, '')}/boxscore`;
      window.location.href = target;
    }
  };

  return (
    <article
      data-testid="game-card"
      data-status={game.status}
      data-matchup-source={matchupSource}
      onClick={handleClick}
      className={[
        'bg-white rounded-2xl border border-warm-2 p-4 md:p-5 transition-all',
        isFinished
          ? 'cursor-pointer hover:shadow-lg hover:-translate-y-0.5'
          : 'cursor-default',
      ].join(' ')}
    >
      <div
        data-testid="matchup-label"
        className="text-xs font-condensed text-txt-light mb-2"
      >
        {isCombo ? `對戰 ${game.num}` : `場次 ${game.num}${game.time ? ` · ${game.time}` : ''}`}
      </div>

      <div className="flex items-center justify-between mb-3">
        <TeamSide
          team={game.home}
          score={game.homeScore}
          isWinner={winner === 'home'}
          testid="home"
        />
        <div className="text-txt-light text-xs font-condensed mx-2">VS</div>
        <TeamSide
          team={game.away}
          score={game.awayScore}
          isWinner={winner === 'away'}
          testid="away"
          reverse
        />
      </div>

      <div className="border-t border-warm-2 pt-3 flex items-center justify-between">
        <StatusBadge status={game.status} />
        {showStaffToggle && (
          <button
            data-testid="staff-toggle"
            aria-label={staffOpen ? '收起工作人員' : '展開工作人員'}
            aria-expanded={staffOpen}
            onClick={(e) => {
              e.stopPropagation();
              setStaffOpen((prev) => !prev);
            }}
            className="text-sm text-txt-mid hover:text-orange transition flex items-center gap-1"
          >
            <span aria-hidden="true">👨‍⚖️</span>
            <span>{staffCount}</span>
            <span aria-hidden="true">{staffOpen ? '▲' : '▼'}</span>
          </button>
        )}
      </div>

      {staffOpen && showStaffToggle && (
        <div
          data-testid="staff-panel"
          className="mt-3 pt-3 border-t border-warm-2 space-y-1 text-sm"
        >
          {Object.entries(game.staff).map(([role, names]) =>
            names.length > 0 ? (
              <div key={role} className="flex gap-2">
                <span className="text-txt-light font-bold w-12">
                  {STAFF_LABELS[role] ?? role}
                </span>
                <span className="text-txt-mid">{names.join('、')}</span>
              </div>
            ) : null,
          )}
        </div>
      )}
    </article>
  );
}

function TeamSide({
  team,
  score,
  isWinner,
  testid,
  reverse = false,
}: {
  team: string;
  score: number | null;
  isWinner: boolean;
  testid: 'home' | 'away';
  reverse?: boolean;
}) {
  const colorClass = TEAM_COLOR_CLASS[team] ?? 'bg-gray-400';
  return (
    <div
      className={[
        'flex-1 flex items-center gap-2',
        reverse ? 'flex-row-reverse text-right' : 'flex-row',
      ].join(' ')}
      data-winner={isWinner}
    >
      <div
        className={`w-3 h-3 rounded-full ${colorClass} flex-shrink-0`}
        aria-hidden="true"
      />
      <div className="flex flex-col">
        <div className="font-condensed text-sm text-txt-mid">{team}隊</div>
        <div
          data-testid={`score-${testid}`}
          className={[
            'font-display text-2xl md:text-3xl',
            isWinner ? 'text-orange font-extrabold' : 'text-txt-dark',
          ].join(' ')}
        >
          {score == null ? '—' : score}
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: Game['status'] }) {
  const label = status === 'finished' ? '完賽' : '即將進行';
  const colorClass =
    status === 'finished'
      ? 'bg-warm-2 text-txt-mid'
      : 'bg-orange-light text-orange';
  return (
    <span
      data-testid="status-badge"
      className={`px-2 py-0.5 rounded text-xs font-condensed font-bold ${colorClass}`}
    >
      {label}
    </span>
  );
}
