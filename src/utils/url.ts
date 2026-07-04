import type { SaveDataType } from '../constants';

type UrlNormalizeOptions = Pick<SaveDataType, 'ignorePathname' | 'ignoreQuery' | 'ignoreHash'>;

export const parseUrl = (url: URL, options?: UrlNormalizeOptions) => {
  const { origin, hash, search } = url;
  const pathname = url.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/, '/');

  return {
    origin,
    hash: options?.ignoreHash ? '' : hash,
    search: options?.ignoreQuery ? '' : search,
    pathname: options?.ignorePathname ? '' : pathname,
  };
};

export const getUrl = (url: string | undefined, options?: UrlNormalizeOptions) => {
  if (!url) {
    return null;
  }

  const { origin, pathname, search, hash } = parseUrl(new URL(url), options);

  return `${origin}${pathname}${search}${hash}`;
};
