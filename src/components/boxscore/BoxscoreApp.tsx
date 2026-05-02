// src/components/boxscore/BoxscoreApp.tsx
import { useCallback, useEffect, useState } from 'react';
import {
  parseBoxscoreQuery,
  resolveDefaultTab,
  buildBoxscoreUrl,
  type BoxscoreTab,
  type BoxscoreUrlState,
} from '../../lib/boxscore-deep-link';
import { BoxscoreHero } from './BoxscoreHero';
import { SubTabs } from './SubTabs';
import { BoxscorePanel } from './BoxscorePanel';
import { LeadersPanel } from './LeadersPanel';

interface Props {
  /** 從 Astro 傳入：import.meta.env.BASE_URL（含尾斜線） */
  baseUrl: string;
}

const SEASON = 25;

function readUrlState(): BoxscoreUrlState {
  if (typeof window === 'undefined') return { tab: null, week: null, game: null };
  return parseBoxscoreQuery(window.location.search);
}

export function BoxscoreApp({ baseUrl }: Props) {
  const initial = readUrlState();
  const [activeTab, setActiveTab] = useState<BoxscoreTab>(resolveDefaultTab(initial));
  const [activeWeek, setActiveWeek] = useState<number | null>(initial.week);
  const [initialGame] = useState<number | null>(initial.game);

  // popstate（瀏覽器上下頁）→ 重新解析 URL
  useEffect(() => {
    const handler = () => {
      const s = readUrlState();
      setActiveTab(resolveDefaultTab(s));
      setActiveWeek(s.week);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // 切 tab → 更新 URL（leaders 清掉 week/game）
  const handleSelectTab = useCallback(
    (tab: BoxscoreTab) => {
      setActiveTab(tab);
      const next: BoxscoreUrlState =
        tab === 'leaders'
          ? { tab: 'leaders', week: null, game: null }
          : { tab: 'boxscore', week: activeWeek, game: null };
      // boxscore tab 切回時清除 highlight game（避免每次切回都 re-scroll）
      const url = buildBoxscoreUrl(deriveBase(baseUrl), next);
      window.history.replaceState(null, '', url);
    },
    [activeWeek, baseUrl],
  );

  // boxscore panel 換週時 → 同步 URL（保留 tab=boxscore）
  const handleWeekChange = useCallback(
    (week: number | null) => {
      setActiveWeek(week);
      if (activeTab !== 'boxscore') return;
      const url = buildBoxscoreUrl(deriveBase(baseUrl), {
        tab: 'boxscore',
        week,
        game: null,
      });
      window.history.replaceState(null, '', url);
    },
    [activeTab, baseUrl],
  );

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <BoxscoreHero activeTab={activeTab} season={SEASON} />
      <SubTabs activeTab={activeTab} onSelect={handleSelectTab} />

      {/* 兩 panel 都掛載，但只顯示 active 的 → 切換瞬間立即顯示對應 panel 的 skeleton */}
      <div style={{ display: activeTab === 'leaders' ? 'block' : 'none' }}>
        <LeadersPanel />
      </div>
      <div style={{ display: activeTab === 'boxscore' ? 'block' : 'none' }}>
        <BoxscorePanel
          initialWeek={activeWeek}
          initialGame={initialGame}
          onWeekChange={handleWeekChange}
        />
      </div>
    </div>
  );
}

/**
 * baseUrl 形如 "/" 或 "/taan-basketball-league/"
 * 串成 "/boxscore" 或 "/taan-basketball-league/boxscore"
 */
function deriveBase(baseUrl: string): string {
  const trimmed = baseUrl.replace(/\/$/, '');
  return `${trimmed}/boxscore`;
}
