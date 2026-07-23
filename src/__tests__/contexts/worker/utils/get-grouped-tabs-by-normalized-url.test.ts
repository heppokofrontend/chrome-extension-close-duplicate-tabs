import { describe, it, expect } from 'vitest';

import { getGroupedTabsByNormalizedUrl } from '@/contexts/worker/utils/get-grouped-tabs-by-normalized-url';

describe('getGroupedTabsByNormalizedUrl', () => {
  it('groups tabs by their normalized url', () => {
    const result = getGroupedTabsByNormalizedUrl({
      tabs: [
        { id: 1, url: 'https://a.com/' },
        { id: 2, url: 'https://a.com/' },
        { id: 3, url: 'https://b.com/' },
      ],
    });

    expect([...result]).toStrictEqual([
      [
        'https://a.com/',
        [
          { id: 1, url: 'https://a.com/' },
          { id: 2, url: 'https://a.com/' },
        ],
      ],
      ['https://b.com/', [{ id: 3, url: 'https://b.com/' }]],
    ]);
  });

  it('ignores tabs without a numeric id', () => {
    const result = getGroupedTabsByNormalizedUrl({
      tabs: [{ url: 'https://a.com/' }, { id: 2, url: 'https://a.com/' }],
    });

    expect([...result]).toStrictEqual([['https://a.com/', [{ id: 2, url: 'https://a.com/' }]]]);
  });

  it('skips tabs whose url fails to normalize', () => {
    const result = getGroupedTabsByNormalizedUrl({
      tabs: [
        { id: 1, url: undefined },
        { id: 2, url: 'https://a.com/' },
      ],
    });

    expect([...result]).toStrictEqual([['https://a.com/', [{ id: 2, url: 'https://a.com/' }]]]);
  });

  it('honors url normalize options when grouping', () => {
    const result = getGroupedTabsByNormalizedUrl({
      tabs: [
        { id: 1, url: 'https://a.com/#top' },
        { id: 2, url: 'https://a.com/#bottom' },
      ],
      options: { ignoreHash: true },
    });

    expect([...result]).toStrictEqual([
      [
        'https://a.com/',
        [
          { id: 1, url: 'https://a.com/#top' },
          { id: 2, url: 'https://a.com/#bottom' },
        ],
      ],
    ]);
  });
});
