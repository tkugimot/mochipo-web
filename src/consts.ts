// TODO: replace with the production URL before deploying.
export const SITE_URL = 'https://mochipo.example.com';
export const SITE_TITLE = 'mochipo';
export const SITE_DESCRIPTION = 'mochipo のブログとお知らせ';
export const DEFAULT_OG_IMAGE = '/og-default.png';

export const CATEGORIES = ['news', 'guide', 'column'] as const;
export const CATEGORY_LABELS: Record<(typeof CATEGORIES)[number], string> = {
  news: 'お知らせ',
  guide: 'ガイド',
  column: 'コラム',
};
