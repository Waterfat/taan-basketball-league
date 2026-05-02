interface Props {
  season: number;
  phase: string;
  civilianThreshold: number;
}

export function RosterHero({ season, phase, civilianThreshold }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1
        data-testid="hero-title"
        className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2"
      >
        ROSTER · 第 {season} 季
      </h1>
      <div
        data-testid="hero-subtitle"
        className="font-condensed text-base md:text-lg text-txt-mid"
      >
        {phase} · 平民線 {civilianThreshold} 分
      </div>
    </header>
  );
}
