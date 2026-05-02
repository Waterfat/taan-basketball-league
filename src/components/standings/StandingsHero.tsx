interface Props {
  season: number;
  phase: string;
  currentWeek: number;
}

export function StandingsHero({ season, phase, currentWeek }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1 className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        STANDINGS · {phase}
      </h1>
      <div className="font-condensed text-base md:text-lg text-txt-mid">
        第 {season} 季 · 第 {currentWeek} 週
      </div>
    </header>
  );
}
