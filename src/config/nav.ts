/**
 * 站台主導覽
 */

export interface NavItem {
  id: string;
  label: string;
  icon: string;
  href: string;
}

export const NAV_ITEMS: NavItem[] = [
  { id: 'home', label: '首頁', icon: '🏠', href: '/' },
  { id: 'schedule', label: '賽程', icon: '📅', href: '/schedule' },
  { id: 'standings', label: '戰績榜', icon: '🏆', href: '/standings' },
  { id: 'boxscore', label: '數據', icon: '📊', href: '/boxscore' },
  { id: 'leaders', label: '領先榜', icon: '🏅', href: '/leaders' },
  { id: 'roster', label: '球員名單', icon: '👥', href: '/roster' },
  { id: 'dragon', label: '龍虎榜', icon: '🐉', href: '/dragon' },
];

/** 暫未開放（保留入口備查） */
export const NAV_ITEMS_DISABLED: NavItem[] = [
  { id: 'stats', label: '數據統計', icon: '📊', href: '/stats' },
  { id: 'rotation', label: '輪值', icon: '📋', href: '/rotation' },
  { id: 'history', label: '歷史', icon: '📜', href: '/history' },
  { id: 'hof', label: '名人堂', icon: '🏛', href: '/hof' },
  { id: 'announce', label: '公告', icon: '📢', href: '/announce' },
];
