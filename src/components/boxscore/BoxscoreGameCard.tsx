// src/components/boxscore/BoxscoreGameCard.tsx
import { useState } from 'react';
import type { BoxscoreGame } from '../../types/boxscore';
import { BoxscoreTeamTable } from './BoxscoreTeamTable';

interface Props {
  game: BoxscoreGame;
  highlight?: boolean;
}

export function BoxscoreGameCard({ game, highlight = false }: Props) {
  const [staffOpen, setStaffOpen] = useState(false);
  const staffEntries = Object.entries(game.staff).filter(([, names]) => names.length > 0);
  const staffCount = staffEntries.reduce((n, [, arr]) => n + arr.length, 0);

  return (
    <article
      data-testid="bs-game-card"
      data-game={game.game}
      data-highlighted={highlight}
      className={[
        'bg-white border rounded-2xl p-4 md:p-5 transition',
        highlight ? 'border-orange ring-2 ring-orange/40' : 'border-warm-2',
      ].join(' ')}
    >
      <h3
        data-testid="bs-game-title"
        className="font-condensed text-lg md:text-xl text-navy mb-3"
      >
        第 {game.week} 週 第 {game.game} 場 — {game.home.team} {game.home.score} vs {game.away.score} {game.away.team}
      </h3>

      <div className="space-y-4">
        <BoxscoreTeamTable team={game.home} />
        <BoxscoreTeamTable team={game.away} />
      </div>

      {staffCount > 0 && (
        <div className="mt-3 border-t border-warm-2 pt-3">
          <button
            data-testid="bs-staff-toggle"
            aria-expanded={staffOpen}
            onClick={() => setStaffOpen((p) => !p)}
            className="text-sm text-txt-mid hover:text-orange transition flex items-center gap-1"
          >
            <span aria-hidden="true">👨‍⚖️</span>
            <span>工作人員 ({staffCount})</span>
            <span aria-hidden="true">{staffOpen ? '▲' : '▼'}</span>
          </button>
          {staffOpen && (
            <div data-testid="bs-staff-panel" className="mt-2 space-y-1 text-sm">
              {staffEntries.map(([role, names]) => (
                <div key={role} className="flex gap-2">
                  <span className="text-txt-light font-bold w-12">{role}</span>
                  <span className="text-txt-mid">{names.join('、')}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </article>
  );
}
