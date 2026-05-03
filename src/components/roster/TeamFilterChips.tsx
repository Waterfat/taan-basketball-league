/**
 * 隊伍切換 chips（球員名單 tab 上方）
 *
 * 對應 E-601~E-604 (B-8.*) + BQ-3：
 *   - 顯示 7 個 chip：全部 + 紅黑藍綠黃白
 *   - 點選後 onSelect(value)，由父層管理 state
 *   - 選中 chip 有 aria-pressed="true" + active 樣式
 *
 * 設計原則：
 *   - chip filter 為純 client-side state，不寫 URL（與 deep-link `?team=<id>` 解耦）
 *   - 隊伍配色從 TEAM_CONFIG 讀取（禁止 hardcode 色碼）
 */

import { TEAM_CONFIG } from '../../config/teams';

export type TeamFilterValue = 'all' | '紅' | '黑' | '藍' | '綠' | '黃' | '白';

const TEAMS: TeamFilterValue[] = ['all', '紅', '黑', '藍', '綠', '黃', '白'];
const LABELS: Record<TeamFilterValue, string> = {
  all: '全部隊伍',
  紅: '紅',
  黑: '黑',
  藍: '藍',
  綠: '綠',
  黃: '黃',
  白: '白',
};

interface Props {
  selected: TeamFilterValue;
  onSelect: (next: TeamFilterValue) => void;
}

export function TeamFilterChips({ selected, onSelect }: Props) {
  return (
    <div
      data-testid="roster-team-chips"
      className="flex flex-wrap gap-2 px-4 md:px-8 mb-3"
    >
      {TEAMS.map((t) => {
        const isActive = selected === t;
        const config = t === 'all' ? null : TEAM_CONFIG[t] ?? null;
        const accentColor = config?.color ?? '#999';
        return (
          <button
            key={t}
            type="button"
            data-testid="roster-team-chip"
            data-team={t}
            aria-pressed={isActive}
            onClick={() => onSelect(t)}
            className={[
              'px-3 py-1 text-sm rounded-full border transition select-none',
              isActive
                ? 'bg-orange text-white border-orange'
                : 'bg-white text-txt-dark border-warm-2 hover:border-orange',
            ].join(' ')}
            style={
              !isActive && t !== 'all'
                ? { borderLeftColor: accentColor, borderLeftWidth: 3 }
                : undefined
            }
          >
            {LABELS[t]}
          </button>
        );
      })}
    </div>
  );
}
