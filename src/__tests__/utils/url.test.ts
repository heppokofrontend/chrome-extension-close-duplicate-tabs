import { describe, it, expect } from 'vitest';

import { normalizeOrigin, normalizeUrl } from '@/utils';

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
  });
});

describe('normalizeOrigin', () => {
  it('returns the origin unchanged when it is already a full URL', () => {
    expect(normalizeOrigin('https://example.com')).toBe('https://example.com');
  });

  it('strips the path and query when a full URL is given', () => {
    expect(normalizeOrigin('https://example.com/path?query=1')).toBe('https://example.com');
  });

  it('keeps the port when present', () => {
    expect(normalizeOrigin('https://example.com:8080')).toBe('https://example.com:8080');
  });

  it('defaults to https:// when the scheme is omitted', () => {
    expect(normalizeOrigin('example.com:8080')).toBe('https://example.com:8080');
  });

  it('trims surrounding whitespace', () => {
    expect(normalizeOrigin('  example.com  ')).toBe('https://example.com');
  });

  it('returns null for empty input', () => {
    expect(normalizeOrigin('')).toBeNull();
  });

  it('returns null when the value cannot be parsed as a URL', () => {
    expect(normalizeOrigin('not a url')).toBeNull();
  });
});
