import { describe, it, expect } from 'vitest';

import type { NormalizedUrl } from '@/utils';
import { pickTabIdsToClose } from '@/worker/remove-duplicates';

const normalize = (url: string) => url as NormalizedUrl;

describe('pickTabIdsToClose', () => {
  it('never closes the current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [{ id: 1, url: normalize('https://a.com'), windowId: 1 }],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toStrictEqual([]);
  });

  // ab218bc (Change tab closing logic): 現在のタブと同じ URL のタブがすべて閉じられる
  // ことを固定する。currentUrl を事前に checkedUrl へ登録しないと、現在のタブと同じ
  // URL を持つタブのうち最初の 1 件が「残す側」として誤って生き残ってしまう。
  it('closes every other tab sharing the current tab url, not just the extras', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 1, url: normalize('https://a.com'), windowId: 1 }, // current tab
        { id: 2, url: normalize('https://a.com'), windowId: 1 },
        { id: 3, url: normalize('https://a.com'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result.toSorted((a, b) => a - b)).toStrictEqual([2, 3]);
  });

  it('keeps the first occurrence and closes the rest for urls unrelated to the current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: normalize('https://b.com'), windowId: 1 },
        { id: 3, url: normalize('https://b.com'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toStrictEqual([3]);
  });

  it('ignores tabs without a url', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, windowId: 1 },
        { id: 3, url: normalize('https://b.com'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: null,
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result).toStrictEqual([]);
  });

  // #? : ignoreHash などの正規化フラグを ON にした場合、呼び出し元 (removeDuplicatedTabs)
  // は candidateTabs[].url に正規化済み URL を詰める。その状態でも current tab と同じ
  // 正規化 URL を持つタブがすべて閉じられることを保証する。
  it('closes tabs whose normalized url matches the current tab (hash stripped upstream)', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 1, url: normalize('https://a.com/foo'), windowId: 1 }, // current tab (normalized)
        { id: 2, url: normalize('https://a.com/foo'), windowId: 1 },
        { id: 3, url: normalize('https://a.com/foo'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com/foo'),
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result.toSorted((a, b) => a - b)).toStrictEqual([2, 3]);
  });

  it('keeps only the first occurrence when a group of normalized urls does not include the current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: normalize('https://a.com/foo'), windowId: 1 },
        { id: 3, url: normalize('https://a.com/foo'), windowId: 1 },
        { id: 4, url: normalize('https://a.com/foo'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://b.com/'),
      currentWindowId: 1,
      includeAllWindow: false,
    });

    expect(result.toSorted((a, b) => a - b)).toStrictEqual([3, 4]);
  });

  it('prioritizes the current window so its tab is kept when includeAllWindow is enabled', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: normalize('https://b.com'), windowId: 2 },
        { id: 3, url: normalize('https://b.com'), windowId: 1 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: true,
    });

    expect(result).toStrictEqual([2]);
  });
});
