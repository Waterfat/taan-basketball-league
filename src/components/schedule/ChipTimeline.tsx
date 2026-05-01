import { useState } from 'react';
import type { ScheduleWeek, SuspendedWeek } from '../../types/schedule';
import { isSuspended } from '../../lib/schedule-utils';

interface Props {
  weeks: ScheduleWeek[];
  activeWeek: number;
  onSelect: (week: number) => void;
}

export function ChipTimeline({ weeks, activeWeek, onSelect }: Props) {
  const [popoverIdx, setPopoverIdx] = useState<number | null>(null);

  return (
    <div className="relative">
      <div
        className="flex gap-2 overflow-x-auto pb-2 px-4 md:px-8 scrollbar-thin"
        role="tablist"
        aria-label="賽程週次時間軸"
      >
        {weeks.map((week, idx) => {
          if (isSuspended(week)) {
            return (
              <SuspendedChipBtn
                key={`s-${idx}`}
                week={week}
                isOpen={popoverIdx === idx}
                onToggle={() =>
                  setPopoverIdx((prev) => (prev === idx ? null : idx))
                }
              />
            );
          }
          const isActive = week.week === activeWeek;
          return (
            <button
              key={`w-${week.week}`}
              role="tab"
              aria-selected={isActive}
              data-testid="chip-week"
              data-active={isActive}
              data-week={week.week}
              onClick={() => {
                setPopoverIdx(null);
                onSelect(week.week);
              }}
              className={[
                'flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-condensed font-bold transition whitespace-nowrap',
                isActive
                  ? 'bg-orange text-white'
                  : 'bg-warm-1 text-txt-mid hover:bg-warm-2',
              ].join(' ')}
            >
              <span className="md:hidden">W{week.week}</span>
              <span className="hidden md:inline">
                W{week.week} · {formatShortDate(week.date)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function SuspendedChipBtn({
  week,
  isOpen,
  onToggle,
}: {
  week: SuspendedWeek;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="relative flex-shrink-0">
      <button
        data-testid="chip-suspended"
        aria-label={`暫停週：${week.reason}`}
        aria-expanded={isOpen}
        onClick={onToggle}
        className="px-3 py-2 rounded-lg bg-gray-200 text-gray-500 font-condensed text-sm hover:bg-gray-300 transition whitespace-nowrap"
      >
        休
      </button>
      {isOpen && (
        <div
          role="tooltip"
          className="absolute z-50 top-full mt-2 left-0 bg-navy text-white text-sm px-3 py-2 rounded-lg shadow-xl whitespace-nowrap"
        >
          {formatShortDate(week.date)} · {week.reason}
        </div>
      )}
    </div>
  );
}

function formatShortDate(date: string): string {
  const parts = date.split('/');
  return parts.length === 3 ? `${parts[1]}/${parts[2]}` : date;
}
