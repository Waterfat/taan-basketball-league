import { useCallback, useEffect, useRef } from 'react';
import type { RosterData, AttValue } from '../../types/roster';
import { getAttClass, getAttBgStyle } from '../../lib/roster-utils';
import { TEAM_CONFIG } from '../../config/teams';

interface AttBlockProps {
  att: AttValue;
  teamColor: string;
}

function AttBlock({ att, teamColor }: AttBlockProps) {
  const cls = [
    'inline-flex items-center justify-center w-6 h-6 text-xs font-bold rounded select-none',
    att === '?' ? 'border border-dashed border-gray-400 text-gray-400' : 'text-white',
    getAttClass(att),
  ].join(' ');
  const style = att !== '?' ? getAttBgStyle(att, teamColor) : {};

  return (
    <span
      data-testid="att-block"
      data-att={String(att)}
      className={cls}
      style={style}
      aria-label={String(att)}
    >
      {String(att)}
    </span>
  );
}

interface PlayerRowProps {
  player: RosterData['teams'][number]['players'][number];
  teamColor: string;
}

function PlayerRow({ player, teamColor }: PlayerRowProps) {
  return (
    <div data-testid="roster-player-row" className="flex items-center gap-2 py-1.5 border-b border-warm-1 last:border-0">
      <span data-testid="player-name" className="w-20 shrink-0 text-sm font-medium text-txt-dark">
        {player.name}
      </span>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {player.att.map((att, i) => (
          <AttBlock key={i} att={att as AttValue} teamColor={teamColor} />
        ))}
      </div>
    </div>
  );
}

function PlayerCard({ player, teamColor }: PlayerRowProps) {
  return (
    <div data-testid="roster-player-card" className="rounded-lg border border-warm-2 p-3">
      <div data-testid="player-name" className="font-medium text-txt-dark mb-2">
        {player.name}
      </div>
      <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1">
        {player.att.map((att, i) => (
          <AttBlock key={i} att={att as AttValue} teamColor={teamColor} />
        ))}
      </div>
    </div>
  );
}

interface TeamSectionProps {
  team: RosterData['teams'][number];
  highlighted: boolean;
  setRef: (el: HTMLElement | null) => void;
}

function TeamSection({ team, highlighted, setRef }: TeamSectionProps) {
  const config = TEAM_CONFIG[team.name.replace('隊', '')] ?? null;
  const teamColor = config?.color ?? '#999';

  return (
    <section
      ref={setRef}
      data-testid="roster-team-section"
      data-team-id={team.id}
      data-highlighted={highlighted ? 'true' : undefined}
      className={[
        'bg-white rounded-2xl border mb-4 p-4 transition-all',
        highlighted ? 'border-orange ring-2 ring-orange/30' : 'border-warm-2',
      ].join(' ')}
    >
      <h2 className="font-bold text-base mb-3" style={{ color: teamColor }}>
        {team.name}
      </h2>
      <div className="hidden md:block" data-testid="roster-table">
        <table className="w-full text-sm">
          <tbody>
            {team.players.map((p) => (
              <PlayerRow key={p.name} player={p} teamColor={teamColor} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="md:hidden space-y-2">
        {team.players.map((p) => (
          <PlayerCard key={p.name} player={p} teamColor={teamColor} />
        ))}
      </div>
    </section>
  );
}

interface Props {
  data: RosterData;
  highlightTeamId: string | null;
}

export function RosterTabPanel({ data, highlightTeamId }: Props) {
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});

  const setRef = useCallback(
    (id: string) => (el: HTMLElement | null) => {
      sectionRefs.current[id] = el;
    },
    [],
  );

  useEffect(() => {
    if (!highlightTeamId) return;
    const el = sectionRefs.current[highlightTeamId];
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [highlightTeamId]);

  return (
    <div data-testid="roster-tab-panel" className="px-4 md:px-8 py-4 max-w-6xl mx-auto">
      {data.teams.map((team) => (
        <TeamSection
          key={team.id}
          team={team}
          highlighted={highlightTeamId === team.id}
          setRef={setRef(team.id)}
        />
      ))}
    </div>
  );
}
