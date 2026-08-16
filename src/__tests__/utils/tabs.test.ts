import { describe, it, expect, vi, afterEach } from 'vitest';

import { getTabs } from '@/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getTabs', () => {
  it('restricts to the current window and excludes pinned tabs by default', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 1 }]);
    vi.stubGlobal('chrome', { tabs: { query } });

    const result = await getTabs({ includeAllWindow: false, includePinnedTabs: false });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: false,
    });
    expect(result).toStrictEqual([{ id: 1 }]);
  });

  it('queries every window when includeAllWindow is true', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 2 }]);
    vi.stubGlobal('chrome', { tabs: { query } });

    await getTabs({ includeAllWindow: true, includePinnedTabs: false });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: undefined,
      pinned: false,
    });
  });

  it('includes pinned tabs when includePinnedTabs is true', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 3 }]);
    vi.stubGlobal('chrome', { tabs: { query } });

    await getTabs({ includeAllWindow: false, includePinnedTabs: true });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: undefined,
    });
  });

  it('includes tabs in a tab group by default', async () => {
    const query = vi.fn().mockResolvedValue([
      { id: 1, groupId: -1 },
      { id: 2, groupId: 10 },
    ]);
    vi.stubGlobal('chrome', { tabs: { query } });

    const result = await getTabs({ includeAllWindow: false, includePinnedTabs: false });

    expect(result).toStrictEqual([
      { id: 1, groupId: -1 },
      { id: 2, groupId: 10 },
    ]);
  });

  it('excludes tabs in a tab group when includeGroupedTabs is false', async () => {
    const query = vi.fn().mockResolvedValue([
      { id: 1, groupId: -1 },
      { id: 2, groupId: 10 },
    ]);
    vi.stubGlobal('chrome', {
      tabs: { query },
      tabGroups: { TAB_GROUP_ID_NONE: -1 },
    });

    const result = await getTabs({
      includeAllWindow: false,
      includePinnedTabs: false,
      includeGroupedTabs: false,
    });

    expect(result).toStrictEqual([{ id: 1, groupId: -1 }]);
  });
});
