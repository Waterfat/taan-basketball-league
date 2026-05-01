/**
 * 隊伍配置 — 集中管理所有隊伍的視覺與識別屬性
 * 從舊專案 shared-app.js TEAM_CONFIG 移植
 *
 * 改隊伍配色 / 新增隊伍只能改這裡，禁止在元件 inline 寫死
 */

export type TeamColorId = 'red' | 'black' | 'blue' | 'green' | 'yellow' | 'white';

export interface TeamConfig {
  /** 隊伍 ID（英文） */
  id: TeamColorId;
  /** 隊伍中文名（紅/黑/藍/...） */
  name: string;
  /** 主色 */
  color: string;
  /** 進度條色 */
  barColor: string;
  /** 文字色 */
  textColor: string;
  /** 背景色（半透明） */
  bg: string;
}

export const TEAM_CONFIG: Record<string, TeamConfig> = {
  紅: {
    id: 'red',
    name: '紅',
    color: '#e53935',
    barColor: '#e53935',
    textColor: '#e53935',
    bg: 'rgba(229,57,53,.14)',
  },
  黑: {
    id: 'black',
    name: '黑',
    color: '#4a4a4a',
    barColor: '#4a4a4a',
    textColor: '#4a4a4a',
    bg: 'rgba(40,40,40,.12)',
  },
  藍: {
    id: 'blue',
    name: '藍',
    color: '#1976d2',
    barColor: '#1976d2',
    textColor: '#1976d2',
    bg: 'rgba(25,118,210,.12)',
  },
  綠: {
    id: 'green',
    name: '綠',
    color: '#2e7d32',
    barColor: '#2e7d32',
    textColor: '#2e7d32',
    bg: 'rgba(46,125,50,.16)',
  },
  黃: {
    id: 'yellow',
    name: '黃',
    color: '#b38f00',
    barColor: '#e6b800',
    textColor: '#b38f00',
    bg: 'rgba(230,184,0,.14)',
  },
  白: {
    id: 'white',
    name: '白',
    color: '#757575',
    barColor: '#9e9e9e',
    textColor: '#757575',
    bg: 'rgba(158,158,158,.07)',
  },
};

/** 以 id 反查 */
export const TEAM_BY_ID: Record<TeamColorId, TeamConfig> = Object.values(TEAM_CONFIG).reduce(
  (acc, team) => {
    acc[team.id] = team;
    return acc;
  },
  {} as Record<TeamColorId, TeamConfig>,
);

/** 以名稱安全取得設定（失敗回 fallback） */
export function getTeam(name: string | null | undefined): TeamConfig | null {
  if (!name) return null;
  return TEAM_CONFIG[name] ?? null;
}
