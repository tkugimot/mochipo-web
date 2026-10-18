export const SITE_URL = 'https://toki-mochi.com';
export const OPERATOR = 'Toshimitsu Kugimoto';
export const DEFAULT_OG_IMAGE = '/og-default.png';
export const TOKIMOCHI_APP_STORE_URL = 'https://apps.apple.com/app/id6476399286';

// Which app (or the company itself) an article is about.
export const APP_IDS = ['tokimochi', 'mochipo', 'company'] as const;
export type AppId = (typeof APP_IDS)[number];
