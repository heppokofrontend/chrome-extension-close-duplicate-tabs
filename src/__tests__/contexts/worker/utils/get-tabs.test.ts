import { describe, it, expect, vi, afterEach } from 'vitest';

import { getAllTabs, getCurrentTab, getTabs } from '@/contexts/worker/utils';

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('getCurrentTab', () => {
  it('returns the active tab in the current window', async () => {
    const currentTab = { id: 1 };
    const query = vi.fn().mockResolvedValue([currentTab]);
    vi.stubGlobal('chrome', { tabs: { query } });

    const result = await getCurrentTab();

    expect(query).toHaveBeenCalledWith({ active: true, currentWindow: true });
    expect(result).toBe(currentTab);
  });

  it('throws when there is no active tab in the current window', async () => {
    const query = vi.fn().mockResolvedValue([]);
    vi.stubGlobal('chrome', { tabs: { query } });

    await expect(getCurrentTab()).rejects.toThrow('No active tab found in the current window.');
  });
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

describe('getAllTabs', () => {
  it('queries all normal-window tabs when windowId is undefined', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 1 }]);
    vi.stubGlobal('chrome', { tabs: { query } });

    const result = await getAllTabs(undefined);

    expect(query).toHaveBeenCalledWith({ windowType: 'normal' });
    expect(result).toStrictEqual([{ id: 1 }]);
  });

  it('scopes the query to the given windowId when provided', async () => {
    const query = vi.fn().mockResolvedValue([{ id: 2 }]);
    vi.stubGlobal('chrome', { tabs: { query } });

    const result = await getAllTabs(42);

    expect(query).toHaveBeenCalledWith({ windowType: 'normal', windowId: 42 });
    expect(result).toStrictEqual([{ id: 2 }]);
  });
});
