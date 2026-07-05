import { describe, it, expect } from 'vitest';

import { resolveDuplicatedCreatedTab } from '@/worker/auto-avoid-duplicates/resolve-duplicated-created-tab';
import type { CreatedTab } from '@/worker/auto-avoid-duplicates/types';

const toCreatedTab = (
  tab: Pick<CreatedTab, 'id' | 'url' | 'windowId'> & { pinned?: boolean },
): CreatedTab => ({
  active: true,
  index: 0,
  pinned: false,
  ...tab,
});

describe('resolveDuplicatedCreatedTab', () => {
  it('returns null when there is no duplicate', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1, pinned: false }),
      existingTabs: [{ id: 1, url: 'https://b.com/', windowId: 1 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toBeNull();
  });

  it('returns the existing tab id when duplicated in the current window', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('returns null when duplicate exists only in another window and all-window scope is off', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 2 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toBeNull();
  });

  it('returns the target when duplicate exists in another window and all-window scope is on', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 2 }],
      userSettings: { includeAllWindow: true, includePinnedTabs: false },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('returns null when the only candidate is pinned and includePinnedTabs is off', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1, pinned: true }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toBeNull();
  });

  it('returns the pinned candidate when includePinnedTabs is on', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1, pinned: true }],
      userSettings: { includeAllWindow: false, includePinnedTabs: true },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('returns null when the target tab itself is pinned and includePinnedTabs is off', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1, pinned: true }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toBeNull();
  });

  it('returns the target when the target tab itself is pinned and includePinnedTabs is on', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/', windowId: 1, pinned: true }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: true },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('normalizes with ignoreHash', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/#foo', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/#bar', windowId: 1 }],
      userSettings: {
        includeAllWindow: false,
        includePinnedTabs: false,
        urlNormalizeOptions: { ignoreHash: true },
      },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('normalizes with ignoreQuery', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/?a=1', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/?a=2', windowId: 1 }],
      userSettings: {
        includeAllWindow: false,
        includePinnedTabs: false,
        urlNormalizeOptions: { ignoreQuery: true },
      },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('normalizes with ignorePathname', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 2, url: 'https://a.com/foo', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/bar', windowId: 1 }],
      userSettings: {
        includeAllWindow: false,
        includePinnedTabs: false,
        urlNormalizeOptions: { ignorePathname: true },
      },
    });

    expect(result).toStrictEqual({
      closeTabId: 2,
      keepTabId: 1,
    });
  });

  it('does not mistakenly include the target tab itself as a candidate', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 1, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [{ id: 1, url: 'https://a.com/', windowId: 1 }],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toBeNull();
  });

  it('keeps the tab with the smallest id when multiple duplicates exist', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 3, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [
        { id: 5, url: 'https://a.com/', windowId: 1 },
        { id: 2, url: 'https://a.com/', windowId: 1 },
      ],
      userSettings: { includeAllWindow: false, includePinnedTabs: false },
    });

    expect(result).toStrictEqual({
      closeTabId: 3,
      keepTabId: 2,
    });
  });

  it('exposes the original window id of the kept tab for cross-window duplicates', () => {
    const result = resolveDuplicatedCreatedTab({
      createdTab: toCreatedTab({ id: 10, url: 'https://a.com/', windowId: 1 }),
      existingTabs: [
        { id: 3, url: 'https://a.com/', windowId: 7 },
        { id: 5, url: 'https://a.com/', windowId: 9 },
      ],
      userSettings: { includeAllWindow: true, includePinnedTabs: false },
    });

    expect(result).toStrictEqual({
      closeTabId: 10,
      keepTabId: 3,
    });
  });
});
