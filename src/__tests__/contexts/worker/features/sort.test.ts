import { describe, it, expect, vi, afterEach } from 'vitest';

import { type SortableTab, getSorter, runSort, sortTabs } from '@/contexts/worker/features/sort';
import { defaultSaveData } from '@/utils';

const makeChromeTab = (overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab => ({
  index: 0,
  pinned: false,
  highlighted: false,
  windowId: 1,
  active: false,
  frozen: false,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  ...overrides,
});

const makeTab = (overrides: Partial<SortableTab> = {}): SortableTab => ({
  id: 1,
  hostname: 'a.com',
  url: 'https://a.com/',
  title: 'A',
  pinned: false,
  windowId: 1,
  ...overrides,
});

describe('getSorter', () => {
  it('sorts by url when sortType is sortByUrl', () => {
    const sorter = getSorter('sortByUrl');
    const tabs = [
      makeTab({ id: 1, url: 'https://b.com/' }),
      makeTab({ id: 2, url: 'https://a.com/' }),
    ];

    expect(tabs.toSorted(sorter).map((tab) => tab.id)).toStrictEqual([2, 1]);
  });

  it('sortByUrl: returns 1 when a comes after b', () => {
    const sorter = getSorter('sortByUrl');
    const a = makeTab({ id: 1, url: 'https://b.com/' });
    const b = makeTab({ id: 2, url: 'https://a.com/' });

    expect(sorter(a, b)).toBe(1);
  });

  it('sorts by title when sortType is sortByTitle', () => {
    const sorter = getSorter('sortByTitle');
    const tabs = [makeTab({ id: 1, title: 'Zebra' }), makeTab({ id: 2, title: 'Apple' })];

    expect(tabs.toSorted(sorter).map((tab) => tab.id)).toStrictEqual([2, 1]);
  });

  it('sorts by hostname then title when sortType is sortByHostAndTitle', () => {
    const sorter = getSorter('sortByHostAndTitle');
    const tabs = [
      makeTab({ id: 1, hostname: 'b.com', title: 'A' }),
      makeTab({ id: 2, hostname: 'a.com', title: 'Z' }),
      makeTab({ id: 3, hostname: 'a.com', title: 'A' }),
    ];

    expect(tabs.toSorted(sorter).map((tab) => tab.id)).toStrictEqual([3, 2, 1]);
  });

  it('falls back to sorting by hostname then title for undefined sortType', () => {
    const tabs = [
      makeTab({ id: 1, hostname: 'b.com', title: 'A' }),
      makeTab({ id: 2, hostname: 'a.com', title: 'Z' }),
    ];

    expect(tabs.toSorted(getSorter(undefined)).map((tab) => tab.id)).toStrictEqual([2, 1]);
  });

  it('treats equal keys as equal, preserving relative order', () => {
    const sorter = getSorter('sortByUrl');
    const a = makeTab({ id: 1, url: 'https://a.com/' });
    const b = makeTab({ id: 2, url: 'https://a.com/' });

    expect(sorter(a, b)).toBe(0);
  });

  it('sortByTitle: returns 1 when a comes after b, and 0 when titles are equal', () => {
    const sorter = getSorter('sortByTitle');
    const a = makeTab({ id: 1, title: 'Zebra' });
    const b = makeTab({ id: 2, title: 'Apple' });

    expect(sorter(a, b)).toBe(1);
    expect(sorter(a, a)).toBe(0);
  });

  it('sortByHostAndTitle: returns 1 when hostname ties and title comes after, and 0 when both tie', () => {
    const sorter = getSorter('sortByHostAndTitle');
    const a = makeTab({ id: 1, hostname: 'a.com', title: 'Zebra' });
    const b = makeTab({ id: 2, hostname: 'a.com', title: 'Apple' });

    expect(sorter(a, b)).toBe(1);
    expect(sorter(a, a)).toBe(0);
  });

  it('sortByHostAndTitle: returns 1 when hostname alone determines a comes after b', () => {
    const sorter = getSorter('sortByHostAndTitle');
    const a = makeTab({ id: 1, hostname: 'z.com', title: 'A' });
    const b = makeTab({ id: 2, hostname: 'a.com', title: 'A' });

    expect(sorter(a, b)).toBe(1);
  });
});

describe('sortTabs', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('sorts each window independently and moves pinned tabs before unpinned ones', async () => {
    const move = vi.fn();
    vi.stubGlobal('chrome', { tabs: { move } });

    const tabs = [
      makeChromeTab({ id: 10, windowId: 1, pinned: false, url: 'https://b.com/', title: 'B' }),
      makeChromeTab({ id: 11, windowId: 1, pinned: true, url: 'https://a.com/', title: 'A' }),
      makeChromeTab({ id: 20, windowId: 2, pinned: false, url: 'https://z.com/', title: 'Z' }),
      makeChromeTab({ id: 21, windowId: 2, pinned: false, url: 'https://a.com/', title: 'A2' }),
    ];

    await sortTabs(tabs, 'sortByUrl');

    expect(move.mock.calls).toStrictEqual([
      [11, { windowId: 1, index: 0 }],
      [10, { windowId: 1, index: 5 }],
      [21, { windowId: 2, index: 6 }],
      [20, { windowId: 2, index: 7 }],
    ]);
  });

  it('ignores tabs missing url, title, or id', async () => {
    const move = vi.fn();
    vi.stubGlobal('chrome', { tabs: { move } });

    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/', title: 'A' }),
      makeChromeTab({ id: undefined, url: 'https://b.com/', title: 'B' }),
      makeChromeTab({ id: 2, url: undefined, title: 'C' }),
      makeChromeTab({ id: 3, url: 'https://d.com/', title: undefined }),
    ];

    await sortTabs(tabs, 'sortByUrl');

    expect(move).toHaveBeenCalledTimes(1);
    expect(move).toHaveBeenCalledWith(1, { windowId: 1, index: 1 });
  });
});

describe('runSort', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('queries tabs per saveData scope and sorts them', async () => {
    const query = vi.fn().mockResolvedValue([
      makeChromeTab({ id: 1, url: 'https://b.com/', title: 'B' }),
      makeChromeTab({ id: 2, url: 'https://a.com/', title: 'A' }),
    ]);
    const move = vi.fn();
    vi.stubGlobal('chrome', { tabs: { query, move } });

    await runSort({ saveData: defaultSaveData, sort: 'sortByUrl' });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: defaultSaveData.includeAllWindow ? undefined : true,
      pinned: defaultSaveData.includePinnedTabs ? undefined : false,
    });
    expect(move.mock.calls).toStrictEqual([
      [2, { windowId: 1, index: 2 }],
      [1, { windowId: 1, index: 3 }],
    ]);
  });
});
