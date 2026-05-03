import type { RosterTab } from '../../types/roster';

interface Props {
  season: number;
  phase: string;
  civilianThreshold: number;
  activeTab: RosterTab;
}

/**
 * Roster hero header
 *
 * 行為：
 *   - roster tab：顯示「ROSTER · 第 N 季」+ 副標「{phase} · 平民線 N 分」（既有行為）
 *   - dragon tab：顯示「龍虎榜 · 第 N 季」+ 副標「活躍度積分累計 · 決定下賽季選秀順位」+
 *     三個 chip（平民區 / 奴隸區 / ⚠ 季後賽加分於賽季結束後計入）
 *
 * 對應 E-901 / E-902（B-11.1, B-11.2）。
 */
export function RosterHero({ season, phase, civilianThreshold, activeTab }: Props) {
  const isDragon = activeTab === 'dragon';
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1
        data-testid="hero-title"
        className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2"
      >
        {isDragon ? '龍虎榜' : 'ROSTER'} · 第 {season} 季
      </h1>
      <div
        data-testid="hero-subtitle"
        className="font-condensed text-base md:text-lg text-txt-mid"
      >
        {isDragon
          ? '活躍度積分累計 · 決定下賽季選秀順位'
          : `${phase} · 平民線 ${civilianThreshold} 分`}
      </div>
      {isDragon && (
        <div className="mt-3 flex flex-wrap justify-center gap-2 text-xs">
          <span
            data-testid="hero-chip-civilian"
            className="px-2 py-1 bg-warm-1 rounded-full"
          >
            🧑 平民區
          </span>
          <span
            data-testid="hero-chip-slave"
            className="px-2 py-1 bg-warm-1 rounded-full"
          >
            ⛓️ 奴隸區
          </span>
          <span
            data-testid="hero-chip-playoff-note"
            className="px-2 py-1 bg-warm-1 rounded-full"
          >
            ⚠ 季後賽加分於賽季結束後計入
          </span>
        </div>
      )}
    </header>
  );
}
