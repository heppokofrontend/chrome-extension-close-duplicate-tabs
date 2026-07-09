import { describe, it, expect, vi, afterEach } from 'vitest';

import type { SaveDataType } from '@/utils';
import { runReload } from '@/worker/features/reload';

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

const saveData: SaveDataType = { includeAllWindow: false, includePinnedTabs: false };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runReload', () => {
  it('reloads every tab that has a numeric id', async () => {
    const tabs = [
      makeChromeTab({ id: 1 }),
      makeChromeTab({ id: 2 }),
      makeChromeTab({ id: undefined }),
    ];
    const query = vi.fn().mockResolvedValue(tabs);
    const reload = vi.fn();
    vi.stubGlobal('chrome', { tabs: { query, reload } });

    await runReload({ saveData });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: false,
    });
    expect(reload.mock.calls).toStrictEqual([[1], [2]]);
  });

  it('does nothing when there are no tabs to reload', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const reload = vi.fn();
    vi.stubGlobal('chrome', { tabs: { query, reload } });

    await runReload({ saveData });

    expect(reload).not.toHaveBeenCalled();
  });
});
