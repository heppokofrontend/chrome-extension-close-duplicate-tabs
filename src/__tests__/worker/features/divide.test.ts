import { describe, it, expect, vi, afterEach } from 'vitest';

import type { SaveDataType } from '@/utils';
import { runDivide } from '@/worker/features/divide';

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

const stubChrome = (currentTab: chrome.tabs.Tab, tabs: chrome.tabs.Tab[]) => {
  const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
    Promise.resolve(arg.active ? [currentTab] : tabs),
  );
  const windowsCreate = vi.fn().mockResolvedValue({ id: 200 });
  const windowsUpdate = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    tabs: { query, update },
    windows: { create: windowsCreate, update: windowsUpdate },
  });

  return { query, windowsCreate, windowsUpdate, update };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runDivide', () => {
  it('opens a new window for every tab except the current one and preserves pinned state', async () => {
    const currentTab = makeChromeTab({ id: 99, windowId: 5 });
    const tabs = [
      makeChromeTab({ id: 99, windowId: 5 }),
      makeChromeTab({ id: 1, pinned: true }),
      makeChromeTab({ id: 2, pinned: false }),
      makeChromeTab({ id: undefined }),
    ];
    const { windowsCreate, windowsUpdate, update } = stubChrome(currentTab, tabs);

    await runDivide({ saveData });

    expect(windowsCreate.mock.calls).toStrictEqual([[{ tabId: 1 }], [{ tabId: 2 }]]);
    expect(update).toHaveBeenCalledWith(1, { pinned: true });
    expect(update).toHaveBeenCalledWith(2, { pinned: false });
    expect(update).not.toHaveBeenCalledWith(99, expect.anything());
    expect(windowsUpdate).toHaveBeenCalledWith(5, { focused: true });
  });

  it('does not create any window when only the current tab is present', async () => {
    const currentTab = makeChromeTab({ id: 99, windowId: 5 });
    const tabs = [makeChromeTab({ id: 99, windowId: 5 })];
    const { windowsCreate, windowsUpdate } = stubChrome(currentTab, tabs);

    await runDivide({ saveData });

    expect(windowsCreate).not.toHaveBeenCalled();
    expect(windowsUpdate).toHaveBeenCalledWith(5, { focused: true });
  });
});
