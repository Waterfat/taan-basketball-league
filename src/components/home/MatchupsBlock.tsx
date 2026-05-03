import { useState, useEffect } from 'react';
import type { HomeData, MatchupCombo, MatchupGame } from '../../types/home';
import { TEAM_CONFIG } from '../../config/teams';
import {
  resolveDefaultView,
  parseViewQuery,
  updateViewQuery,
  type MatchupView,
} from '../../lib/matchups-toggle-utils';

interface Props {
  weekMatchups: HomeData['weekMatchups'];
  scheduleInfo: HomeData['scheduleInfo'];
  baseUrl: string;
}

/**
 * 首頁本週對戰預覽（Issue #14 B1）。
 *
 * 兼容舊 ScheduleBlock 行為：保留 `home-schedule` testid + 日期 / 場地 / 「看本週對戰」CTA。
 * 在此之上加上 6 組對戰卡片 + 「對戰組合 / 賽程順序」toggle（當 weekMatchups 存在時）。
 *
 * 智慧切換：
 *   - games[] 全空 → 預設「對戰組合」視圖 + unpublished hint
 *   - games[] 有 home/away → 預設「賽程順序」視圖
 *   - URL ?view=combo|order 優先於智慧預設
 */
export function MatchupsBlock({ weekMatchups, scheduleInfo, baseUrl }: Props) {
  // 先用 SSR-safe 的智慧預設；mount 後再讀 URL query 同步
  const [view, setView] = useState<MatchupView>(() => resolveDefaultView(weekMatchups));

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const fromQuery = parseViewQuery(window.location.search);
    if (fromQuery) {
      setView(fromQuery);
    }
  }, []);

  const href = `${baseUrl.replace(/\/$/, '')}/schedule`;
  const hasMatchups = !!weekMatchups && (weekMatchups.combos.length > 0 || weekMatchups.games.length > 0);
  const isOrderUnpublished =
    !!weekMatchups && weekMatchups.games.length > 0 && weekMatchups.games.every((g) => !g.home && !g.away);

  // 在 unpublished 情境下，即使 user 點 order，也強制以 combo 顯示卡片內容（spec E-105）
  const effectiveView: MatchupView = isOrderUnpublished ? 'combo' : view;

  const handleSelect = (next: MatchupView) => {
    setView(next);
    updateViewQuery(next);
  };

  return (
    <section
      data-testid="home-matchups"
      className="bg-white border border-warm-2 rounded-2xl p-5 mb-4"
    >
      <div data-testid="home-schedule">
        <h2 className="font-condensed font-bold text-navy text-lg mb-2">📅 本週賽程</h2>
        <p className="text-txt-dark mb-1">下次比賽：{scheduleInfo.date}</p>
        <p className="text-txt-mid text-sm mb-3">📍 {scheduleInfo.venue}</p>

        {hasMatchups && weekMatchups && (
          <>
            <div
              data-testid="matchups-toggle"
              role="radiogroup"
              aria-label="對戰預覽視圖切換"
              className="inline-flex rounded-full border border-warm-2 bg-warm-1 p-0.5 mb-3"
            >
              <button
                type="button"
                data-testid="matchups-toggle-combo"
                role="radio"
                aria-checked={view === 'combo'}
                aria-pressed={view === 'combo'}
                onClick={() => handleSelect('combo')}
                className={[
                  'px-3 py-1 text-sm rounded-full transition font-medium',
                  view === 'combo'
                    ? 'bg-orange text-white'
                    : 'text-txt-mid hover:text-txt-dark',
                ].join(' ')}
              >
                對戰組合
              </button>
              <button
                type="button"
                data-testid="matchups-toggle-order"
                role="radio"
                aria-checked={view === 'order'}
                aria-pressed={view === 'order'}
                onClick={() => handleSelect('order')}
                className={[
                  'px-3 py-1 text-sm rounded-full transition font-medium',
                  view === 'order'
                    ? 'bg-orange text-white'
                    : 'text-txt-mid hover:text-txt-dark',
                ].join(' ')}
              >
                賽程順序
              </button>
            </div>

            {isOrderUnpublished && (
              <p
                data-testid="matchups-unpublished-hint"
                className="text-sm text-txt-mid mb-3"
              >
                ⚠ 本週場次順序尚未公告，先看對戰組合
              </p>
            )}

            {/* combo view */}
            {effectiveView === 'combo' ? (
              <div
                data-testid="matchups-combo-list"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3"
              >
                {weekMatchups.combos.map((c) => (
                  <ComboCard key={`combo-${c.combo}`} combo={c} />
                ))}
              </div>
            ) : (
              <div data-testid="matchups-combo-list" hidden />
            )}

            {/* order view */}
            {effectiveView === 'order' ? (
              <div
                data-testid="matchups-order-list"
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-3"
              >
                {weekMatchups.games.map((g) => (
                  <OrderCard key={`game-${g.num}`} game={g} />
                ))}
              </div>
            ) : (
              <div data-testid="matchups-order-list" hidden />
            )}
          </>
        )}

        <a
          href={href}
          className="inline-block text-sm font-bold text-orange hover:underline"
        >
          看本週對戰 →
        </a>
      </div>
    </section>
  );
}

function ComboCard({ combo }: { combo: MatchupCombo }) {
  const homeColor = TEAM_CONFIG[combo.home]?.color ?? '#999';
  const awayColor = TEAM_CONFIG[combo.away]?.color ?? '#999';
  return (
    <div
      data-testid="matchup-card"
      data-combo={combo.combo}
      className="border border-warm-2 rounded-xl p-3 bg-white"
    >
      <div className="text-xs text-txt-mid mb-1.5">組合 {combo.combo}</div>
      <div className="flex items-center justify-between gap-2 font-condensed">
        <span className="font-bold text-base" style={{ color: homeColor }}>
          {combo.home || 'TBD'}
        </span>
        <span className="text-txt-light text-xs">vs</span>
        <span className="font-bold text-base" style={{ color: awayColor }}>
          {combo.away || 'TBD'}
        </span>
      </div>
    </div>
  );
}

function OrderCard({ game }: { game: MatchupGame }) {
  const homeColor = TEAM_CONFIG[game.home]?.color ?? '#999';
  const awayColor = TEAM_CONFIG[game.away]?.color ?? '#999';
  const showHome = game.home || 'TBD';
  const showAway = game.away || 'TBD';
  return (
    <div
      data-testid="matchup-card"
      data-game-num={game.num}
      className="border border-warm-2 rounded-xl p-3 bg-white"
    >
      <div className="text-xs text-txt-mid mb-1.5 flex items-center justify-between">
        <span>第 {game.num} 場</span>
        {game.time && <span>{game.time}</span>}
      </div>
      <div className="flex items-center justify-between gap-2 font-condensed">
        <span className="font-bold text-base" style={{ color: homeColor }}>
          {showHome}
        </span>
        <span className="text-txt-light text-xs">vs</span>
        <span className="font-bold text-base" style={{ color: awayColor }}>
          {showAway}
        </span>
      </div>
    </div>
  );
}
