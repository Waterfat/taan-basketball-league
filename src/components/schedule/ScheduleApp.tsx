import { useEffect, useState, useCallback } from 'react';
import type { ScheduleData, GameWeek } from '../../types/schedule';
import { fetchData } from '../../lib/api';
import {
  getCurrentWeek,
  findPreviousWeekWithData,
} from '../../lib/schedule-utils';
import { SkeletonState } from './SkeletonState';
import { ErrorState } from './ErrorState';
import { EmptyState } from './EmptyState';
import { ScheduleHero } from './ScheduleHero';
import { ChipTimeline } from './ChipTimeline';
import { GameCard } from './GameCard';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  baseUrl: string;
}

export function ScheduleApp({ baseUrl }: Props) {
  const [data, setData] = useState<ScheduleData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [activeWeek, setActiveWeek] = useState<number | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');

    (async () => {
      const result = await fetchData<ScheduleData>('schedule');
      if (cancelled) return;

      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }

      const sched = result.data;
      setData(sched);

      if (sched.allWeeks.length === 0) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }

      const current = getCurrentWeek(sched);
      if (!current) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }

      setActiveWeek(current.week);
      setStatus('ok');
    })();

    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const handleRetry = useCallback(() => {
    setReloadKey((k) => k + 1);
  }, []);

  const handlePrevWeek = useCallback(() => {
    if (!data) return;
    const fromWeek = activeWeek ?? data.currentWeek;
    const prev = findPreviousWeekWithData(data, fromWeek);
    if (prev) {
      setActiveWeek(prev.week);
      setStatus('ok');
    }
  }, [data, activeWeek]);

  if (status === 'loading') return <SkeletonState />;
  if (status === 'error') return <ErrorState onRetry={handleRetry} />;

  if (status === 'empty' || !data || activeWeek == null) {
    const prevExists =
      data != null &&
      findPreviousWeekWithData(data, data.currentWeek) != null;
    return (
      <EmptyState onPrevWeek={handlePrevWeek} prevDisabled={!prevExists} />
    );
  }

  const activeWeekObj = data.allWeeks.find(
    (w): w is GameWeek => w.type === 'game' && w.week === activeWeek,
  );

  if (!activeWeekObj) {
    return <EmptyState onPrevWeek={handlePrevWeek} prevDisabled={false} />;
  }

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <ScheduleHero week={activeWeekObj} />
      <ChipTimeline
        weeks={data.allWeeks}
        activeWeek={activeWeek}
        onSelect={(w) => setActiveWeek(w)}
      />
      <section className="px-4 md:px-8 mt-6 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        {activeWeekObj.games.map((game) => (
          <GameCard key={game.num} game={game} baseUrl={baseUrl} />
        ))}
      </section>
    </div>
  );
}
