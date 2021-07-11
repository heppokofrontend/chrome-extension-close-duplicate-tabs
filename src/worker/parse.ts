/**
 * URLの正規化
 * @param url - パースするURL
 * @param ignore - パースの仕方
 * @returns originとpathnameだけになったURL
 */
export const parse = (url: string, ignore?: Message.ignore) => {
  const _url = new URL(url);
  const {origin, hash, search} = _url;
  const pathname = _url.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/, '/');

  if (
    ignore?.noHash &&
    ignore?.noQuery
  ) {
    return `${origin}${pathname}`;
  }

  if (ignore?.noHash) {
    return `${origin}${pathname}${search}`;
  }

  if (ignore?.noQuery) {
    return `${origin}${pathname}${hash}`;
  }

  return `${origin}${pathname}${search}${hash}`;
};
