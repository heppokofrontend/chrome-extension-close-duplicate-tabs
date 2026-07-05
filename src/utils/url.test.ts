import { describe, it, expect } from 'vitest';

import { normalizeUrl } from '@/utils';

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
});
