import type { HomeData } from '../../types/home';

interface Props {
  season: HomeData['season'];
  phase: HomeData['phase'];
  currentWeek: HomeData['currentWeek'];
}

export function HeroBanner({ season, phase, currentWeek }: Props) {
  return (
    <header className="text-center mb-8">
      <h1 className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        TAAN BASKETBALL
      </h1>
      <p className="font-display text-xl text-navy tracking-wide">
        第 {season} 季
      </p>
      <p className="text-txt-mid text-sm mt-1">
        {phase} · 第 {currentWeek} 週
      </p>
    </header>
  );
}
