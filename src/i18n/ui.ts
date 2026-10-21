import { TOPICS } from '../lib/contactSchema';

export const LANGS = ['ja', 'en'] as const;
export type Lang = (typeof LANGS)[number];

/** Japanese lives at the site root; English under /en/. */
export function langFromPath(pathname: string): Lang {
  return /^\/en(\/|$)/.test(pathname) ? 'en' : 'ja';
}

export function stripLang(pathname: string): string {
  return pathname.replace(/^\/en(?=\/|$)/, '') || '/';
}

export function localePath(lang: Lang, path: string): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  if (lang === 'ja') return p;
  return p === '/' ? '/en/' : `/en${p}`;
}

/** For `src/pages/[...lang]/**`: one page at `/x/` and one at `/en/x/`. */
export function langStaticPaths() {
  return [{ params: { lang: undefined } }, { params: { lang: 'en' } }];
}

export function formatDate(date: Date, lang: Lang): string {
  return date.toLocaleDateString(lang === 'ja' ? 'ja-JP' : 'en-US', {
    timeZone: 'Asia/Tokyo',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

const dict = {
  ja: {
    siteTitle: '時もち',
    siteDescription: '時もちともち歩のアプリ、お知らせ、記事をお届けします。',
    apps: { tokimochi: '時もち', mochipo: 'もち歩', company: '運営' } as Record<string, string>,
    nav: { articles: '記事', about: '運営者情報', contact: 'お問い合わせ', language: 'English' },
    footer: { policy: '時もち 利用規約・プライバシーポリシー', mochipoPolicy: 'もち歩 利用規約・プライバシーポリシー' },
    articles: { title: '記事', description: '時もち・もち歩に関する記事の一覧です。', none: '記事はまだありません。', back: '記事一覧へ' },
    draft: { notice: 'このページは準備中です。内容は確定していません。' },
    author: { role: 'ソフトウェアエンジニア（テックリード）' },
    contact: {
      title: 'お問い合わせ',
      description: 'お問い合わせはこちらのフォームからどうぞ。',
      name: 'お名前',
      email: 'メールアドレス',
      topic: 'お問い合わせ対象',
      topics: { tokimochi: '時もち', mochipo: 'もち歩', other: 'その他' } as Record<(typeof TOPICS)[number], string>,
      message: 'お問い合わせ内容',
      submit: '送信する',
      sending: '送信中…',
      success: '送信しました。ありがとうございます。',
      failure: '送信に失敗しました。時間をおいて再度お試しください。',
      noscript: '送信にはJavaScriptを有効にしてください。',
      errors: {
        name: 'お名前を入力してください(100文字以内)',
        email: 'メールアドレスの形式が正しくありません',
        message: 'お問い合わせ内容を10文字以上5000文字以内で入力してください',
        token: 'スパム対策の確認が完了していません。少し待ってからもう一度お試しください',
      },
    },
    notFound: { title: 'ページが見つかりません', text: 'お探しのページは見つかりませんでした。', home: 'トップへ戻る' },
  },
  en: {
    siteTitle: 'Time Rich',
    siteDescription: 'Apps, news and articles from Time Rich and Mochipo.',
    apps: { tokimochi: 'Time Rich', mochipo: 'Mochipo', company: 'About us' } as Record<string, string>,
    nav: { articles: 'Articles', about: 'About us', contact: 'Contact', language: '日本語' },
    footer: { policy: 'Time Rich Terms of Use and Privacy Policy', mochipoPolicy: 'Mochipo Terms of Use and Privacy Policy' },
    articles: { title: 'Articles', description: 'Articles about Time Rich and Mochipo.', none: 'No articles yet.', back: 'All articles' },
    draft: { notice: 'This page is a work in progress. Its content is not final.' },
    author: { role: 'Software Engineer (Tech Lead)' },
    contact: {
      title: 'Contact',
      description: 'Send us a message using the form below.',
      name: 'Name',
      email: 'Email',
      topic: 'Which app is this about?',
      topics: { tokimochi: 'Time Rich', mochipo: 'Mochipo', other: 'Other' } as Record<(typeof TOPICS)[number], string>,
      message: 'Message',
      submit: 'Send',
      sending: 'Sending…',
      success: 'Sent. Thank you!',
      failure: 'Failed to send. Please try again later.',
      noscript: 'Please enable JavaScript to send a message.',
      errors: {
        name: 'Please enter your name (up to 100 characters)',
        email: 'The email address is not valid',
        message: 'Please enter a message of 10 to 5000 characters',
        token: 'The spam check has not finished. Please wait a moment and try again',
      },
    },
    notFound: { title: 'Page not found', text: 'The page you are looking for does not exist.', home: 'Back to home' },
  },
} as const;

export function t(lang: Lang) {
  return dict[lang];
}
