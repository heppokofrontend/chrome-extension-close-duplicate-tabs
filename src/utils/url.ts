import type { UrlNormalizeOptions } from '@/utils';

// 正規化 URL であることを型で示すためのブランド。生の URL 文字列と混ざるとフラグが実質的に
// 無効化されるため、型で区別して呼び出し側に強制する。
declare const normalizedUrlBrand: unique symbol;
export type NormalizedUrl = string & { readonly [normalizedUrlBrand]: 'NormalizedUrl' };

/**
 * 入力・保存された origin 文字列を URL#origin 相当へ正規化する。
 * スキームが省略された場合は https:// を補って解釈する。
 * 未入力、または URL として解釈できない値は null（重複判定に使えない）を返す。
 */
export const normalizeOrigin = (value: string): string | null => {
  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const hasScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed);

  try {
    return new URL(hasScheme ? trimmed : `https://${trimmed}`).origin;
  } catch {
    return null;
  }
};

/** origin に一致する高度なパスルールを探す。origin 未入力・不正なルールは対象外とする。 */
const findAdvancedPathRule = (origin: string, options?: UrlNormalizeOptions) => {
  if (!options?.useAdvancedPathRule || !options.advancedPathRules) {
    return undefined;
  }

  return Object.values(options.advancedPathRules).find(
    (rule) => normalizeOrigin(rule.origin) === origin,
  );
};

const parseUrl = (url: URL, options?: UrlNormalizeOptions) => {
  const { origin, hash, search } = url;
  const pathname = url.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/, '/');

  // origin 別ルールが見つかればそちらを優先し、なければ Default（ignorePathname 等）にフォールバックする。
  const rule = findAdvancedPathRule(origin, options);
  const ignorePathname = rule?.pathname ?? options?.ignorePathname;
  const ignoreQuery = rule?.query ?? options?.ignoreQuery;
  const ignoreHash = rule?.hash ?? options?.ignoreHash;

  return {
    origin,
    hash: ignoreHash ? '' : hash,
    search: ignoreQuery ? '' : search,
    pathname: ignorePathname ? '' : pathname,
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
