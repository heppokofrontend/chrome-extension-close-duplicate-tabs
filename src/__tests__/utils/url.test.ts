import { describe, it, expect } from 'vitest';

import { normalizeOrigin } from '@/utils';

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
