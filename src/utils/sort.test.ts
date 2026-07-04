import { describe, it, expect } from 'vitest';
import { compareByUrl, compareByTitle, compareByHostAndTitle, getSorter } from './sort';
import type { SortableTab } from './sort';

const tab = (partial: Partial<SortableTab>): SortableTab => ({
  id: 1,
  hostname: 'a.example.com',
  url: 'https://a.example.com',
  title: 'A',
  pinned: false,
  windowId: 1,
  ...partial,
});

describe('compareByUrl', () => {
  it('sorts ascending by url', () => {
    const list = [tab({ url: 'b' }), tab({ url: 'a' })].sort(compareByUrl);
    expect(list.map(({ url }) => url)).toEqual(['a', 'b']);
  });
});

describe('compareByTitle', () => {
  it('sorts ascending by title', () => {
    const list = [tab({ title: 'b' }), tab({ title: 'a' })].sort(compareByTitle);
    expect(list.map(({ title }) => title)).toEqual(['a', 'b']);
  });
});

describe('compareByHostAndTitle', () => {
  it('sorts by hostname first, then title', () => {
    const list = [
      tab({ hostname: 'b.example.com', title: 'z' }),
      tab({ hostname: 'a.example.com', title: 'z' }),
      tab({ hostname: 'a.example.com', title: 'a' }),
    ].sort(compareByHostAndTitle);

    expect(list.map(({ hostname, title }) => `${hostname}:${title}`)).toEqual([
      'a.example.com:a',
      'a.example.com:z',
      'b.example.com:z',
    ]);
  });
});

describe('getSorter', () => {
  it('resolves sortByUrl to compareByUrl', () => {
    expect(getSorter('sortByUrl')).toBe(compareByUrl);
  });

  it('resolves sortByTitle to compareByTitle', () => {
    expect(getSorter('sortByTitle')).toBe(compareByTitle);
  });

  it('falls back to compareByHostAndTitle for sortByHostAndTitle, false or undefined', () => {
    expect(getSorter('sortByHostAndTitle')).toBe(compareByHostAndTitle);
    expect(getSorter('false')).toBe(compareByHostAndTitle);
    expect(getSorter(undefined)).toBe(compareByHostAndTitle);
  });
});
