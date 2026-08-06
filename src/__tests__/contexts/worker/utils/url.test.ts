import { describe, it, expect } from 'vitest';

import { normalizeUrl } from '@/contexts/worker/utils';

describe('normalizeUrl', () => {
  it('returns null for an empty or undefined url', () => {
    expect(normalizeUrl(undefined)).toBeNull();
    expect(normalizeUrl('')).toBeNull();
  });

  it('keeps pathname, query and hash by default', () => {
    expect(normalizeUrl('https://example.com/path?query=1#hash')).toBe(
      'https://example.com/path?query=1#hash',
    );
  });

  it('drops the pathname when ignorePathname is true', () => {
    expect(normalizeUrl('https://example.com/path?query=1#hash', { ignorePathname: true })).toBe(
      'https://example.com?query=1#hash',
    );
  });

  it('drops the query when ignoreQuery is true', () => {
    expect(normalizeUrl('https://example.com/path?query=1#hash', { ignoreQuery: true })).toBe(
      'https://example.com/path#hash',
    );
  });

  it('drops the hash when ignoreHash is true', () => {
    expect(normalizeUrl('https://example.com/path?query=1#hash', { ignoreHash: true })).toBe(
      'https://example.com/path?query=1',
    );
  });

  it('normalizes index files to a trailing slash', () => {
    expect(normalizeUrl('https://example.com/foo/index.html')).toBe('https://example.com/foo/');
    expect(normalizeUrl('https://example.com/foo/index.php')).toBe('https://example.com/foo/');
  });

  describe('advanced path rules', () => {
    it('ignores advancedPathRules when useAdvancedPathRule is false', () => {
      expect(
        normalizeUrl('https://example.com/path?query=1#hash', {
          useAdvancedPathRule: false,
          advancedPathRules: {
            k1: { origin: 'https://example.com', pathname: true, query: true, hash: true },
          },
        }),
      ).toBe('https://example.com/path?query=1#hash');
    });

    it('applies the rule matching the URL origin', () => {
      expect(
        normalizeUrl('https://example.com/path?query=1#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: { origin: 'https://example.com', pathname: true, query: false, hash: false },
          },
        }),
      ).toBe('https://example.com?query=1#hash');
    });

    it('does not match when the scheme differs', () => {
      expect(
        normalizeUrl('http://example.com/path?query=1#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: { origin: 'https://example.com', pathname: true, query: false, hash: false },
          },
        }),
      ).toBe('http://example.com/path?query=1#hash');
    });

    it('matches even when the stored rule origin omits the scheme (defaults to https)', () => {
      expect(
        normalizeUrl('https://example.com/path?query=1#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: { origin: 'example.com', pathname: true, query: false, hash: false },
          },
        }),
      ).toBe('https://example.com?query=1#hash');
    });

    it('falls back to the default (ignorePathname/ignoreQuery/ignoreHash) when no rule matches the origin', () => {
      expect(
        normalizeUrl('https://other.example/path?query=1#hash', {
          useAdvancedPathRule: true,
          ignoreQuery: true,
          advancedPathRules: {
            k1: { origin: 'https://example.com', pathname: true, query: false, hash: false },
          },
        }),
      ).toBe('https://other.example/path#hash');
    });

    it('ignores a rule whose origin is empty or unparsable, falling back to the default', () => {
      expect(
        normalizeUrl('https://example.com/path?query=1#hash', {
          useAdvancedPathRule: true,
          ignoreQuery: true,
          advancedPathRules: {
            k1: { origin: '', pathname: true, query: false, hash: false },
          },
        }),
      ).toBe('https://example.com/path#hash');
    });

    it('keeps only the allowedQueryParams keys when query is ignored', () => {
      expect(
        normalizeUrl('https://example.com/path?keep=1&drop=2#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: {
              origin: 'https://example.com',
              pathname: false,
              query: true,
              hash: false,
              allowedQueryParams: 'keep',
            },
          },
        }),
      ).toBe('https://example.com/path?keep=1#hash');
    });

    it('drops the entire query when allowedQueryParams is empty even though query is ignored', () => {
      expect(
        normalizeUrl('https://example.com/path?keep=1&drop=2#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: {
              origin: 'https://example.com',
              pathname: false,
              query: true,
              hash: false,
              allowedQueryParams: '',
            },
          },
        }),
      ).toBe('https://example.com/path#hash');
    });

    it('trims whitespace around comma-separated allowedQueryParams keys', () => {
      expect(
        normalizeUrl('https://example.com/path?a=1&b=2&c=3#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: {
              origin: 'https://example.com',
              pathname: false,
              query: true,
              hash: false,
              allowedQueryParams: ' a , c ',
            },
          },
        }),
      ).toBe('https://example.com/path?a=1&c=3#hash');
    });

    it('keeps the query untouched when query is not ignored, regardless of allowedQueryParams', () => {
      expect(
        normalizeUrl('https://example.com/path?a=1&b=2#hash', {
          useAdvancedPathRule: true,
          advancedPathRules: {
            k1: {
              origin: 'https://example.com',
              pathname: false,
              query: false,
              hash: false,
              allowedQueryParams: 'a',
            },
          },
        }),
      ).toBe('https://example.com/path?a=1&b=2#hash');
    });
  });
});
