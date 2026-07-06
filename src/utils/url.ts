import type { UrlNormalizeOptions } from '@/utils';

// 正規化 URL であることを型で示すためのブランド。生の URL 文字列と混ざるとフラグが実質的に
// 無効化されるため、型で区別して呼び出し側に強制する。
declare const normalizedUrlBrand: unique symbol;
export type NormalizedUrl = string & { readonly [normalizedUrlBrand]: 'NormalizedUrl' };

const parseUrl = (url: URL, options?: UrlNormalizeOptions) => {
  const { origin, hash, search } = url;
  const pathname = url.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/, '/');

  return {
    origin,
    hash: options?.ignoreHash ? '' : hash,
    search: options?.ignoreQuery ? '' : search,
    pathname: options?.ignorePathname ? '' : pathname,
  };
};

/** URL を正規化オプションに従って正規化する。失敗時は null。 */
export const normalizeUrl = (url: string | undefined, options?: UrlNormalizeOptions) => {
  if (!url) {
    return null;
  }

  const { origin, pathname, search, hash } = parseUrl(new URL(url), options);

  return `${origin}${pathname}${search}${hash}` as NormalizedUrl;
};
