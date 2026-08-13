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
});
