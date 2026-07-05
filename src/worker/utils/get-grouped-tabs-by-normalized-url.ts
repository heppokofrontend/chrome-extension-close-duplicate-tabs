import { normalizeUrl, type NormalizedUrl, type UrlNormalizeOptions } from '@/utils';

/**
 * タブ配列を「正規化 URL → タブ配列」の Map にまとめる。
 *
 * @returns 正規化 URL をキー、同じ正規化 URL を持つタブ配列を値とする Map
 * ```js
 * {
 *    'https://a.com/foo' => [tab1, tab2],
 *    'https://b.com/bar' => [tab3],
 * }
 * ```
 */
export const getGroupedTabsByNormalizedUrl = <
  T extends { id?: number | undefined; url?: string | undefined },
>(
  tabs: readonly T[],
  options?: UrlNormalizeOptions,
): Map<NormalizedUrl, T[]> => {
  const groups = new Map<NormalizedUrl, T[]>();

  for (const tab of tabs) {
    if (typeof tab.id !== 'number') {
      continue;
    }

    const url = normalizeUrl(tab.url, options);

    if (!url) {
      continue;
    }

    const bucket = groups.get(url);

    if (bucket) {
      bucket.push(tab);
    } else {
      groups.set(url, [tab]);
    }
  }

  return groups;
};
