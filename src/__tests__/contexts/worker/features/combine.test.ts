import { describe, it, expect, vi, afterEach } from 'vitest';

import { runCombine } from '@/contexts/worker/features/combine';
import type { SaveDataType } from '@/utils';

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

/** getCurrentTab（active:true）と getTabs を同じ query モックで分岐させる。 */
const stubChrome = (currentTab: chrome.tabs.Tab, tabs: chrome.tabs.Tab[]) => {
  const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
    Promise.resolve(arg.active ? [currentTab] : tabs),
  );
  const move = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', { tabs: { query, move, update } });

  return { query, move, update };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runCombine', () => {
  it('always queries every window regardless of includeAllWindow', async () => {
    const currentTab = makeChromeTab({ id: 99, windowId: 1, active: true });
    const { query } = stubChrome(currentTab, []);

    await runCombine({ saveData });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: undefined,
      pinned: false,
    });
  });

  it('moves every tab into the current window, preserves pinned state, and re-activates the current tab', async () => {
    const currentTab = makeChromeTab({ id: 99, windowId: 1, active: true });
    const tabs = [
      makeChromeTab({ id: 1, windowId: 2, pinned: true }),
      makeChromeTab({ id: 2, windowId: 3, pinned: false }),
      makeChromeTab({ id: undefined, windowId: 4 }),
    ];
    const { move, update } = stubChrome(currentTab, tabs);

    await runCombine({ saveData });

    expect(move.mock.calls).toStrictEqual([
      [1, { windowId: 1, index: -1 }],
      [2, { windowId: 1, index: -1 }],
    ]);
    expect(update).toHaveBeenCalledWith(1, { pinned: true });
    expect(update).toHaveBeenCalledWith(2, { pinned: false });
    expect(update).toHaveBeenCalledWith(99, { active: true });
  });

  it('skips re-activating when the current tab has no numeric id', async () => {
    const currentTab = makeChromeTab({ id: undefined, windowId: 1, active: true });
    const tabs = [makeChromeTab({ id: 1, windowId: 2, pinned: false })];
    const { update } = stubChrome(currentTab, tabs);

    await runCombine({ saveData });

    expect(update).not.toHaveBeenCalledWith(undefined, { active: true });
    expect(update).toHaveBeenCalledWith(1, { pinned: false });
  });
});
