import { describe, it, expect } from 'vitest';
import { pickTabIdsToClose } from './remove-duplicates';

describe('pickTabIdsToClose', () => {
  it('never closes the current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [{ id: 1, url: 'https://a.com', windowId: 1 }],
      currentTabId: 1,
      currentUrl: 'https://a.com',
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toEqual([]);
  });

  // ab218bc (Change tab closing logic): 現在のタブと同じ URL のタブがすべて閉じられる
  // ことを固定する。currentUrl を事前に checkedUrl へ登録しないと、現在のタブと同じ
  // URL を持つタブのうち最初の 1 件が「残す側」として誤って生き残ってしまう。
  it('closes every other tab sharing the current tab url, not just the extras', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 1, url: 'https://a.com', windowId: 1 }, // current tab
        { id: 2, url: 'https://a.com', windowId: 1 },
        { id: 3, url: 'https://a.com', windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: 'https://a.com',
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result.sort()).toEqual([2, 3]);
  });

  it('keeps the first occurrence and closes the rest for urls unrelated to the current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: 'https://b.com', windowId: 1 },
        { id: 3, url: 'https://b.com', windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: 'https://a.com',
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toEqual([3]);
  });

  it('ignores tabs without a url', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: undefined, windowId: 1 },
        { id: 3, url: 'https://b.com', windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: null,
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toEqual([]);
  });

  it('prioritizes the current window so its tab is kept when includeAllWindow is enabled', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: 'https://b.com', windowId: 2 },
        { id: 3, url: 'https://b.com', windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: 'https://a.com',
      currentWindowId: 1,
      includeAllWindow: true,
    });

    expect(result).toEqual([2]);
  });
});
