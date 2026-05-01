/**
 * 站台基本設定
 */

export const SITE = {
  name: '大安ㄍㄤㄍㄤ好籃球聯盟',
  shortName: '大安籃球聯盟',
  description: '社區業餘籃球聯盟官方網站。賽程、戰績、球員名單、龍虎榜、數據統計。',
  url: import.meta.env.PUBLIC_SITE_URL ?? 'https://waterfat.github.io/taan-basketball-league',
  base: '/taan-basketball-league',
  locale: 'zh-TW',
} as const;
