// src/components/boxscore/BoxscoreHero.tsx
import type { BoxscoreTab } from '../../lib/boxscore-deep-link';

interface Props {
  activeTab: BoxscoreTab;
  season: number;
}

export function BoxscoreHero({ activeTab, season }: Props) {
  const subtitle = activeTab === 'leaders' ? '領先榜' : '逐場 Box';
  return (
    <header data-testid="data-hero" className="text-center px-4 py-6 md:py-10">
      <h1
        data-testid="hero-title"
        className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2"
      >
        DATA · 第 {season} 季
      </h1>
      <p
        data-testid="hero-subtitle"
        className="font-condensed text-base md:text-lg text-txt-mid"
      >
        {subtitle}
      </p>
    </header>
  );
}
