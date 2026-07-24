import { describe, it, expect } from 'vitest';

import { getDuplicatedTabIdsToClose, pickTabIdsToClose } from '@/contexts/worker/utils';
import type { NormalizedUrl } from '@/utils';

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

  it('leaves an already-first current-window tab in place ahead of a later non-current tab', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: normalize('https://b.com'), windowId: 1 },
        { id: 3, url: normalize('https://b.com'), windowId: 2 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: true,
    });

    expect(result).toStrictEqual([3]);
  });

  it('does not reorder two candidates that are both outside the current window', () => {
    const result = pickTabIdsToClose({
      candidateTabs: [
        { id: 2, url: normalize('https://b.com'), windowId: 5 },
        { id: 3, url: normalize('https://b.com'), windowId: 6 },
      ],
      currentTabId: 1,
      currentUrl: normalize('https://a.com'),
      currentWindowId: 1,
      includeAllWindow: true,
    });

    expect(result).toStrictEqual([3]);
  });
});

describe('getDuplicatedTabIdsToClose', () => {
  it('returns an empty array when no tabs share a normalized url', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/', windowId: 1 },
      tabs: [
        { id: 1, url: 'https://a.com/', windowId: 1 },
        { id: 2, url: 'https://b.com/', windowId: 1 },
      ],
      options: {},
    });

    expect(result).toStrictEqual([]);
  });

  it('closes every other tab sharing the current tab url and keeps the current tab', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/', windowId: 1 },
      tabs: [
        { id: 1, url: 'https://a.com/', windowId: 1 },
        { id: 2, url: 'https://a.com/', windowId: 1 },
        { id: 3, url: 'https://a.com/', windowId: 1 },
      ],
      options: {},
    });

    expect(result.toSorted((a, b) => a - b)).toStrictEqual([2, 3]);
  });

  it('keeps the first occurrence for duplicate groups unrelated to the current tab', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/', windowId: 1 },
      tabs: [
        { id: 1, url: 'https://a.com/', windowId: 1 },
        { id: 2, url: 'https://b.com/', windowId: 1 },
        { id: 3, url: 'https://b.com/', windowId: 1 },
      ],
      options: {},
    });

    expect(result).toStrictEqual([3]);
  });

  it('treats raw urls as duplicates according to the normalize options', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/?q=1#top', windowId: 1 },
      tabs: [
        { id: 1, url: 'https://a.com/?q=1#top', windowId: 1 },
        { id: 2, url: 'https://a.com/?q=1#bottom', windowId: 1 },
        { id: 3, url: 'https://a.com/?q=2', windowId: 1 },
      ],
      options: { ignoreHash: true },
    });

    expect(result).toStrictEqual([2]);
  });

  it('does not treat different urls as duplicates when normalize options are off', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/#top', windowId: 1 },
      tabs: [
        { id: 1, url: 'https://a.com/#top', windowId: 1 },
        { id: 2, url: 'https://a.com/#bottom', windowId: 1 },
      ],
      options: { ignoreHash: false },
    });

    expect(result).toStrictEqual([]);
  });

  it('keeps the current window tab when includeAllWindow is enabled', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 1, url: 'https://a.com/', windowId: 1 },
      tabs: [
        { id: 2, url: 'https://b.com/', windowId: 2 },
        { id: 3, url: 'https://b.com/', windowId: 1 },
      ],
      options: { includeAllWindow: true },
    });

    expect(result).toStrictEqual([2]);
  });

  it('ignores tabs without an id when picking duplicates', () => {
    const result = getDuplicatedTabIdsToClose({
      currentTab: { id: 9, url: 'https://b.com/', windowId: 1 },
      tabs: [
        { url: 'https://a.com/', windowId: 1 },
        { id: 2, url: 'https://a.com/', windowId: 1 },
        { id: 3, url: 'https://a.com/', windowId: 1 },
      ],
      options: {},
    });

    expect(result).toStrictEqual([3]);
  });
});
