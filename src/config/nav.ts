/**
 * 站台主導覽
 *
 * 5-tab 架構：5 個主入口，每個 tab 下可有子分類（用頁內 tab 切換）。
 * 設計原則：行動裝置 bottom nav 上限 5 個，icon + label 都能呼吸。
 */

export interface NavSubTab {
  id: string;
  label: string;
}

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
  /** 該頁內的子分類 tab（可選） */
  subTabs?: NavSubTab[];
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '首頁', icon: '🏠', href: '/' },
  { id: 'schedule', label: '賽程', icon: '📅', href: '/schedule' },
  { id: 'standings', label: '戰績', icon: '🏆', href: '/standings' },
  {
    id: 'data',
    label: '數據',
    icon: '📊',
    href: '/boxscore',
    subTabs: [
      { id: 'boxscore', label: '逐場 Box' },
      { id: 'leaders', label: '領先榜' },
    ],
  },
  {
    id: 'players',
    label: '球員',
    icon: '👥',
    href: '/roster',
    subTabs: [
      { id: 'roster', label: '名單' },
      { id: 'dragon', label: '積分龍虎榜' },
    ],
  },
];

/** 暫未開放（保留入口備查，不顯示於 nav） */
export const NAV_ITEMS_DISABLED: NavItem[] = [
  { id: 'stats', label: '進階數據', icon: '📈', href: '/stats' },
  { id: 'rotation', label: '輪值', icon: '📋', href: '/rotation' },
  { id: 'history', label: '歷史', icon: '📜', href: '/history' },
  { id: 'hof', label: '名人堂', icon: '🏛', href: '/hof' },
];
