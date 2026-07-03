import { describe, it, expect } from 'vitest';
import { getUrl } from './url';

describe('getUrl', () => {
  it('returns null for an empty or undefined url', () => {
    expect(getUrl(undefined)).toBeNull();
    expect(getUrl('')).toBeNull();
  });

  it('keeps pathname, query and hash by default', () => {
    expect(getUrl('https://example.com/path?query=1#hash')).toBe(
      'https://example.com/path?query=1#hash',
    );
  });

  it('drops the pathname when ignorePathname is true', () => {
    expect(getUrl('https://example.com/path?query=1#hash', { ignorePathname: true })).toBe(
      'https://example.com?query=1#hash',
    );
  });

  it('drops the query when ignoreQuery is true', () => {
    expect(getUrl('https://example.com/path?query=1#hash', { ignoreQuery: true })).toBe(
      'https://example.com/path#hash',
    );
  });

  it('drops the hash when ignoreHash is true', () => {
    expect(getUrl('https://example.com/path?query=1#hash', { ignoreHash: true })).toBe(
      'https://example.com/path?query=1',
    );
  });

  it('normalizes index files to a trailing slash', () => {
    expect(getUrl('https://example.com/foo/index.html')).toBe('https://example.com/foo/');
    expect(getUrl('https://example.com/foo/index.php')).toBe('https://example.com/foo/');
  });
});
