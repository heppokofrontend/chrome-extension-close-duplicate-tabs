import { describe, it, expect, vi, afterEach } from 'vitest';

import { getAllTabs, getCurrentTab } from '@/worker/utils';

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
