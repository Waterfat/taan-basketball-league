// src/components/boxscore/BoxscorePanel.tsx
import { useEffect, useRef, useState, useCallback } from 'react';
import type { BoxscoreData, BoxscoreWeek } from '../../types/boxscore';
import { fetchBoxscore } from '../../lib/boxscore-api';
import { BoxscoreSkeleton } from './BoxscoreSkeleton';
import { BoxscoreError } from './BoxscoreError';
import { BoxscoreEmpty } from './BoxscoreEmpty';
import { BoxscoreGameCard } from './BoxscoreGameCard';

type Status = 'loading' | 'error' | 'empty' | 'ok';

interface Props {
  initialWeek: number | null;
  initialGame: number | null;
  onWeekChange: (week: number | null) => void;
}

export function BoxscorePanel({ initialWeek, initialGame, onWeekChange }: Props) {
  const [data, setData] = useState<BoxscoreData | null>(null);
  const [status, setStatus] = useState<Status>('loading');
  const [activeWeek, setActiveWeek] = useState<number | null>(initialWeek);
  const [reloadKey, setReloadKey] = useState(0);
  const cardRefs = useRef<Map<number, HTMLElement>>(new Map());

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    (async () => {
      const result = await fetchBoxscore();
      if (cancelled) return;
      if (result.source === 'error' || !result.data) {
        setStatus('error');
        return;
      }
      const bs = result.data;
      setData(bs);
      if (bs.weeks.length === 0) {
        setStatus('empty');
        setActiveWeek(null);
        return;
      }
      const targetWeek = activeWeek ?? bs.currentWeek;
      const found = bs.weeks.find((w) => w.week === targetWeek) ?? bs.weeks[bs.weeks.length - 1];
      setActiveWeek(found.week);
      onWeekChange(found.week);
      setStatus('ok');
    })();
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  // deep-link scroll：activeWeek 切到對應週、且 initialGame 存在時，scroll 到該卡片
  useEffect(() => {
    if (status !== 'ok' || initialGame === null) return;
    const el = cardRefs.current.get(initialGame);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [status, activeWeek, initialGame]);

  const handleRetry = useCallback(() => setReloadKey((k) => k + 1), []);
  const handleSelectWeek = useCallback(
    (w: number) => {
      setActiveWeek(w);
      onWeekChange(w);
    },
    [onWeekChange],
  );

  if (status === 'loading') return <BoxscoreSkeleton />;
  if (status === 'error') return <BoxscoreError onRetry={handleRetry} />;
  if (status === 'empty' || !data || activeWeek === null) return <BoxscoreEmpty />;

  const week: BoxscoreWeek | undefined = data.weeks.find((w) => w.week === activeWeek);
  if (!week || week.games.length === 0) return <BoxscoreEmpty />;

  return (
    <div data-testid="boxscore-panel" className="px-4 md:px-8 py-6">
      <div className="flex gap-2 overflow-x-auto pb-2 mb-6 scrollbar-thin" role="tablist" aria-label="週次選擇">
        {data.weeks.map((w) => {
          const isActive = w.week === activeWeek;
          return (
            <button
              key={w.week}
              role="tab"
              aria-selected={isActive}
              data-testid="bs-week-chip"
              data-active={isActive}
              data-week={w.week}
              onClick={() => handleSelectWeek(w.week)}
              className={[
                'flex-shrink-0 px-3 md:px-4 py-2 rounded-lg font-condensed font-bold transition whitespace-nowrap',
                isActive ? 'bg-orange text-white' : 'bg-warm-1 text-txt-mid hover:bg-warm-2',
              ].join(' ')}
            >
              W{w.week}
            </button>
          );
        })}
      </div>

      <div className="space-y-4 md:space-y-6">
        {week.games.map((g) => (
          <div
            key={g.game}
            ref={(el) => {
              if (el) cardRefs.current.set(g.game, el);
              else cardRefs.current.delete(g.game);
            }}
          >
            <BoxscoreGameCard game={g} highlight={initialGame === g.game} />
          </div>
        ))}
      </div>
    </div>
  );
}
