import type { GameWeek } from '../../types/schedule';

interface Props {
  week: GameWeek;
}

export function ScheduleHero({ week }: Props) {
  return (
    <header className="text-center px-4 py-6 md:py-10">
      <h1 className="font-hero text-4xl md:text-6xl text-orange tracking-wider mb-2">
        WEEK {week.week} · {week.phase}
      </h1>
      <div className="font-condensed text-base md:text-lg text-txt-mid flex items-center justify-center gap-2">
        <span>{week.date}</span>
        <span aria-hidden="true">·</span>
        <span className="flex items-center gap-1">
          <span aria-hidden="true">📍</span>
          <span>{week.venue}</span>
        </span>
      </div>
    </header>
  );
}
