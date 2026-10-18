import { getCollection, getEntry } from 'astro:content';
import type { Lang } from '../i18n/ui';

export const slugOf = (id: string) => id.split('/')[1];

/** Published articles in one language, newest first. Drafts show in dev only. */
export async function getArticles(lang: Lang) {
  const all = await getCollection(
    'articles',
    ({ id, data }) => id.startsWith(`${lang}/`) && (import.meta.env.DEV || !data.draft),
  );
  return all.sort((a, b) => b.data.pubDate.valueOf() - a.data.pubDate.valueOf());
}

export async function hasArticle(lang: Lang, slug: string) {
  return Boolean(await getEntry('articles', `${lang}/${slug}`));
}

export async function getLegal(lang: Lang, name: string) {
  const entry = await getEntry('legal', `${lang}/${name}`);
  if (!entry) throw new Error(`Missing legal document: ${lang}/${name}`);
  return entry;
}
