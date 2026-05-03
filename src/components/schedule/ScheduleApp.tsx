import { useEffect, useMemo, useState, useCallback } from 'react';
import type { ScheduleData, Game, GameWeek } from '../../types/schedule';
import { fetchData } from '../../lib/api';
import {
  getCurrentWeek,
  findPreviousWeekWithData,
} from '../../lib/schedule-utils';
import {
  parseViewQuery,
  updateViewQuery,
  type MatchupView,
} from '../../lib/matchups-toggle-utils';
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
  const [view, setView] = useState<MatchupView | null>(null);

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

  // 解析當前 active week 的 GameWeek（可能 null：empty / suspended week）
  const activeWeekObj = useMemo<GameWeek | null>(() => {
    if (!data || activeWeek == null) return null;
    return (
      data.allWeeks.find(
        (w): w is GameWeek => w.type === 'game' && w.week === activeWeek,
      ) ?? null
    );
  }, [data, activeWeek]);

  // active week 的 games[] 是否已公告賽程順序
  const isOrderPublished = useMemo<boolean>(
    () => (activeWeekObj?.games ?? []).some((g) => Boolean(g.home || g.away)),
    [activeWeekObj],
  );

  // 初始 view：URL `?view=` 優先，否則依 isOrderPublished 智慧預設
  // 僅在 view 尚未決定且 activeWeekObj 載入後執行一次
  useEffect(() => {
    if (view !== null) return;
    if (!activeWeekObj) return;
    const fromUrl =
      typeof window !== 'undefined'
        ? parseViewQuery(window.location.search)
        : null;
    setView(fromUrl ?? (isOrderPublished ? 'order' : 'combo'));
  }, [view, activeWeekObj, isOrderPublished]);

  const handleSetView = useCallback((next: MatchupView) => {
    setView(next);
    updateViewQuery(next);
  }, []);

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

  if (!activeWeekObj) {
    return <EmptyState onPrevWeek={handlePrevWeek} prevDisabled={false} />;
  }

  // view 尚未決定（首次 effect 還沒跑完）→ 用智慧預設值同步算一次，避免閃爍
  const effectiveView: MatchupView =
    view ?? (isOrderPublished ? 'order' : 'combo');

  // 將 matchups[] 物件包裝成 Game shape，讓 GameCard 共用
  const comboGames: Game[] = activeWeekObj.matchups.map((m) => ({
    num: m.combo,
    time: '',
    home: m.home,
    away: m.away,
    homeScore: m.homeScore,
    awayScore: m.awayScore,
    status: normalizeMatchupStatus(m.status),
    staff: {},
  }));

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <ScheduleHero week={activeWeekObj} />
      <ChipTimeline
        weeks={data.allWeeks}
        activeWeek={activeWeek}
        onSelect={(w) => setActiveWeek(w)}
      />

      <div className="px-4 md:px-8 mt-6 flex items-center justify-between gap-3 flex-wrap">
        <div
          data-testid="schedule-matchups-toggle"
          role="radiogroup"
          aria-label="對戰組合 / 賽程順序切換"
          className="inline-flex rounded-full bg-warm-1 p-1"
        >
          <ToggleButton
            testid="schedule-matchups-toggle-combo"
            label="對戰組合"
            active={effectiveView === 'combo'}
            onClick={() => handleSetView('combo')}
          />
          <ToggleButton
            testid="schedule-matchups-toggle-order"
            label="賽程順序"
            active={effectiveView === 'order'}
            onClick={() => handleSetView('order')}
          />
        </div>

        {!isOrderPublished && (
          <p
            data-testid="schedule-matchups-unpublished-hint"
            className="text-sm text-txt-mid"
          >
            本週場次順序尚未公告，請看「對戰組合」
          </p>
        )}
      </div>

      {effectiveView === 'combo' ? (
        <section
          data-testid="schedule-matchups-combo-list"
          className="px-4 md:px-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        >
          {comboGames.map((game) => (
            <GameCard
              key={`combo-${game.num}`}
              game={game}
              baseUrl={baseUrl}
              matchupSource="combo"
            />
          ))}
        </section>
      ) : (
        <section
          data-testid="schedule-matchups-order-list"
          className="px-4 md:px-8 mt-4 grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4"
        >
          {activeWeekObj.games.map((game) => (
            <GameCard
              key={`order-${game.num}`}
              game={game}
              baseUrl={baseUrl}
              matchupSource="order"
            />
          ))}
        </section>
      )}
    </div>
  );
}

function ToggleButton({
  testid,
  label,
  active,
  onClick,
}: {
  testid: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      data-testid={testid}
      role="radio"
      aria-checked={active}
      aria-pressed={active}
      onClick={onClick}
      className={[
        'px-4 py-1.5 rounded-full text-sm font-condensed transition-all',
        active
          ? 'bg-white text-orange shadow-sm font-bold'
          : 'text-txt-mid hover:text-txt-dark',
      ].join(' ')}
    >
      {label}
    </button>
  );
}

/** 將 matchups[].status（string）正規化成 GameStatus；空字串 / 未識別 → 'upcoming' */
function normalizeMatchupStatus(status: string): Game['status'] {
  if (status === 'finished' || status === 'in_progress' || status === 'upcoming') {
    return status;
  }
  return 'upcoming';
}
