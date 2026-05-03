import { useCallback, useEffect, useRef } from 'react';
import type { RosterData, RosterWeek, AttValue } from '../../types/roster';
import {
  getAttClass,
  getAttBgStyle,
  computeAttendanceSummary,
} from '../../lib/roster-utils';
import { TEAM_CONFIG } from '../../config/teams';
import type { TeamFilterValue } from './TeamFilterChips';

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

/**
 * 球員列：單一響應式元件（避免重複 testid 造成 strict-mode violation）
 *
 * - 桌機 (≥ md)：橫向 flex 列 — 名稱 / att-blocks / 出席率彙整
 * - 手機 (< md)：兩段式 — 上排（名稱 + 彙整），下排（att-blocks）
 *
 * Testid 唯一性：`roster-player-row`、`player-name`、`roster-attendance-summary`、
 * `att-block` 在 PC + Mobile 共用同一個 DOM 節點（透過 `flex-col md:flex-row`
 * 切換 layout，不複製元素）。`roster-player-card` 套在內層 wrapper 上以維持
 * `rwd.spec.ts` AC-13 向後相容。
 */
function PlayerRow({ player, teamColor }: PlayerRowProps) {
  const summary = computeAttendanceSummary(player.att);
  const summaryText = `${summary.rate}% ${summary.played}/${summary.total}`;

  return (
    <div
      data-testid="roster-player-row"
      className="border-b border-warm-1 last:border-0 md:py-1.5"
    >
      <div
        data-testid="roster-player-card"
        className="flex flex-col md:flex-row md:items-center gap-2 rounded-lg md:rounded-none border border-warm-2 md:border-0 p-3 md:p-0 my-1 md:my-0"
      >
        {/* 桌機：水平排列；手機：上排（名 + 彙整 justify-between） */}
        <div className="flex items-center md:contents">
          <span
            data-testid="player-name"
            className="flex-1 md:flex-none md:w-20 md:shrink-0 text-sm font-medium text-txt-dark"
          >
            {player.name}
          </span>
          <span
            data-testid="roster-attendance-summary"
            data-rate={String(summary.rate)}
            data-played={String(summary.played)}
            data-total={String(summary.total)}
            className="text-xs font-bold text-txt-dark whitespace-nowrap order-3 md:order-none md:pl-2 md:w-20 md:text-right"
          >
            {summaryText}
          </span>
        </div>
        {/* att-blocks：手機在下排、桌機在中段 */}
        <div className="flex gap-1 overflow-x-auto scrollbar-hide pb-1 md:pb-0 md:flex-1 md:order-none order-2">
          {player.att.map((att, i) => (
            <AttBlock key={i} att={att as AttValue} teamColor={teamColor} />
          ))}
        </div>
      </div>
    </div>
  );
}

interface TeamSectionProps {
  team: RosterData['teams'][number];
  highlighted: boolean;
  hidden: boolean;
  setRef: (el: HTMLElement | null) => void;
}

function TeamSection({ team, highlighted, hidden, setRef }: TeamSectionProps) {
  const config = TEAM_CONFIG[team.name.replace('隊', '')] ?? null;
  const teamColor = config?.color ?? '#999';

  return (
    <section
      ref={setRef}
      data-testid="roster-team-section"
      data-team-id={team.id}
      data-highlighted={highlighted ? 'true' : undefined}
      hidden={hidden || undefined}
      className={[
        'bg-white rounded-2xl border mb-4 p-4 transition-all',
        highlighted ? 'border-orange ring-2 ring-orange/30' : 'border-warm-2',
      ].join(' ')}
    >
      <h2 className="font-bold text-base mb-3" style={{ color: teamColor }}>
        {team.name}
      </h2>
      <div data-testid="roster-table">
        {team.players.map((p) => (
          <PlayerRow key={p.name} player={p} teamColor={teamColor} />
        ))}
      </div>
    </section>
  );
}

interface Props {
  data: RosterData;
  highlightTeamId: string | null;
  selectedTeam: TeamFilterValue;
}

/** 把隊伍中文名（紅/黑/...）對應 chip filter 值 */
function teamChineseName(team: RosterData['teams'][number]): string {
  return team.name.replace('隊', '');
}

/**
 * 共享日期欄頭（roster panel 頂端，僅出現一次）
 * 對應 E-501：count = weeks.length（10 個 roster-week-header）。
 *
 * 桌機 + 手機皆可見（手機改為橫向捲動以容納 10 個小日期）。
 */
function WeekHeaderRow({ weeks }: { weeks: RosterWeek[] }) {
  return (
    <div
      aria-hidden="true"
      className="flex items-center gap-2 px-4 pb-2 text-[10px] text-txt-mid overflow-x-auto scrollbar-hide"
    >
      <span className="w-12 md:w-20 shrink-0" />
      <div className="flex gap-1 flex-1">
        {weeks.map((w) => (
          <span
            key={w.wk}
            data-testid="roster-week-header"
            data-week={String(w.wk)}
            className="inline-flex items-center justify-center w-6 text-center whitespace-nowrap"
          >
            {w.date}
          </span>
        ))}
      </div>
      <span className="shrink-0 pl-2 w-16 md:w-20 text-right whitespace-nowrap font-medium">
        出席率
      </span>
    </div>
  );
}

export function RosterTabPanel({ data, highlightTeamId, selectedTeam }: Props) {
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
      <WeekHeaderRow weeks={data.weeks} />
      {data.teams.map((team) => {
        const chineseName = teamChineseName(team);
        const isHidden = selectedTeam !== 'all' && chineseName !== selectedTeam;
        return (
          <TeamSection
            key={team.id}
            team={team}
            highlighted={highlightTeamId === team.id}
            hidden={isHidden}
            setRef={setRef(team.id)}
          />
        );
      })}
    </div>
  );
}
