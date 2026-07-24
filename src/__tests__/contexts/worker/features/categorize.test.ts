import { describe, it, expect, vi, afterEach } from 'vitest';

import { runCategorize } from '@/contexts/worker/features/categorize';
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

/** 保留中の microtask を掃き出す（fire-and-forget な update を待つ）。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runCategorize', () => {
  it('ホスト名ごとに別窓へ振り分け、各グループ先頭を新規ウィンドウにしてから残りを移動する', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      // minCategorizeNumber を 0 にして OTHERS への集約を無効化する。
      minCategorizeNumber: 0,
    };
    const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: 2, url: 'https://a.com/y', windowId: 1 }),
      makeChromeTab({ id: 3, url: 'https://b.com/x', windowId: 1 }),
      makeChromeTab({ id: 4, url: 'https://b.com/y', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    const windowsCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce({ id: 101 });
    const windowsUpdate = vi.fn().mockResolvedValue(undefined);
    const move = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue({ id: 9, windowId: 1 });

    vi.stubGlobal('chrome', {
      tabs: { query, move, update, get },
      windows: { create: windowsCreate, update: windowsUpdate },
    });

    await runCategorize({ saveData });
    await flushPromises();

    // 各ホストの先頭タブで新規ウィンドウを作る。
    expect(windowsCreate).toHaveBeenCalledWith({ tabId: 1 });
    expect(windowsCreate).toHaveBeenCalledWith({ tabId: 3 });
    // 残りのタブを対応するウィンドウへ移動する。
    expect(move).toHaveBeenCalledWith(2, { windowId: 100, index: -1 });
    expect(move).toHaveBeenCalledWith(4, { windowId: 101, index: -1 });
    // 先頭タブと移動タブの pinned 状態を反映する。
    expect(update).toHaveBeenCalledWith(1, { pinned: false });
    expect(update).toHaveBeenCalledWith(3, { pinned: false });
    // 最後にカレントタブへフォーカスを戻す。
    expect(get).toHaveBeenCalledWith(9);
    expect(windowsUpdate).toHaveBeenCalledWith(1, { focused: true });
    expect(update).toHaveBeenCalledWith(9, { active: true });
  });

  it('タブ数が minCategorizeNumber 以下のホストは OTHERS グループへ集約して 1 つの窓にまとめる', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      minCategorizeNumber: 1,
    };
    const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
    const tabs = [
      // a.com は 2 タブ（しきい値 1 超）なので単独グループのまま。
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: 2, url: 'https://a.com/y', windowId: 1 }),
      // b.com / c.com は各 1 タブ（しきい値以下）なので OTHERS へ集約される。
      makeChromeTab({ id: 3, url: 'https://b.com/', windowId: 1 }),
      makeChromeTab({ id: 4, url: 'https://c.com/', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    const windowsCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce({ id: 101 });
    const windowsUpdate = vi.fn().mockResolvedValue(undefined);
    const move = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue({ id: 9, windowId: 1 });

    vi.stubGlobal('chrome', {
      tabs: { query, move, update, get },
      windows: { create: windowsCreate, update: windowsUpdate },
    });

    await runCategorize({ saveData });
    await flushPromises();

    // a.com グループと OTHERS グループの 2 窓のみ。
    // OTHERS は unshift で積まれるため、後から集約された c.com のタブが先頭になる。
    expect(windowsCreate.mock.calls).toStrictEqual([[{ tabId: 1 }], [{ tabId: 4 }]]);
    expect(move).toHaveBeenCalledWith(2, { windowId: 100, index: -1 });
    expect(move).toHaveBeenCalledWith(3, { windowId: 101, index: -1 });
    expect(move).toHaveBeenCalledTimes(2);
  });

  it('pinned なカレントタブが一覧に含まれない場合、同ホストのグループ先頭に加えて pinned 状態を復元する', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      minCategorizeNumber: 0,
    };
    // includePinnedTabs: false のため、pinned なカレントタブは getTabs の結果に含まれない。
    const currentTab = makeChromeTab({ id: 9, url: 'https://a.com/', windowId: 1, pinned: true });
    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: 3, url: 'https://b.com/', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    const windowsCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce({ id: 101 });
    const windowsUpdate = vi.fn().mockResolvedValue(undefined);
    const move = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue({ id: 9, windowId: 100 });

    vi.stubGlobal('chrome', {
      tabs: { query, move, update, get },
      windows: { create: windowsCreate, update: windowsUpdate },
    });

    await runCategorize({ saveData });
    await flushPromises();

    // カレントタブは unshift でグループ先頭になり、新規ウィンドウの起点になる。
    expect(windowsCreate.mock.calls).toStrictEqual([[{ tabId: 9 }], [{ tabId: 3 }]]);
    expect(move).toHaveBeenCalledWith(1, { windowId: 100, index: -1 });
    // 先頭タブとして、および最終フェーズの復元として pinned: true が反映される。
    expect(update).toHaveBeenCalledWith(9, { pinned: true });
    expect(update).toHaveBeenCalledWith(9, { active: true });
    expect(windowsUpdate).toHaveBeenCalledWith(100, { focused: true });
  });

  it('ホストが 1 種類しか無ければ別窓を作らない', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      minCategorizeNumber: 0,
    };
    const currentTab = makeChromeTab({ id: 9, url: 'https://a.com/', windowId: 1 });
    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: 2, url: 'https://a.com/y', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    const windowsCreate = vi.fn().mockResolvedValue({ id: 100 });

    vi.stubGlobal('chrome', {
      tabs: { query },
      windows: { create: windowsCreate },
    });

    await runCategorize({ saveData });

    expect(windowsCreate).not.toHaveBeenCalled();
  });

  it('url または id を持たないタブは振り分け対象から除外する', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      minCategorizeNumber: 0,
    };
    const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: undefined, url: 'https://b.com/x', windowId: 1 }),
      makeChromeTab({ id: 2, url: undefined, windowId: 1 }),
      makeChromeTab({ id: 3, url: 'https://c.com/x', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    const windowsCreate = vi
      .fn()
      .mockResolvedValueOnce({ id: 100 })
      .mockResolvedValueOnce({ id: 101 });
    const windowsUpdate = vi.fn().mockResolvedValue(undefined);
    const move = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue({ id: 9, windowId: 1 });

    vi.stubGlobal('chrome', {
      tabs: { query, move, update, get },
      windows: { create: windowsCreate, update: windowsUpdate },
    });

    await runCategorize({ saveData });
    await flushPromises();

    // id/url が欠けたタブ (b.com) は無視され、a.com と c.com の 2 窓だけが作られる。
    expect(windowsCreate.mock.calls).toStrictEqual([[{ tabId: 1 }], [{ tabId: 3 }]]);
  });

  it('新規ウィンドウが数値の id を返さない場合、そのホストの移動処理をスキップする', async () => {
    const saveData: SaveDataType = {
      includeAllWindow: false,
      includePinnedTabs: false,
      minCategorizeNumber: 0,
    };
    const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
    const tabs = [
      makeChromeTab({ id: 1, url: 'https://a.com/x', windowId: 1 }),
      makeChromeTab({ id: 2, url: 'https://a.com/y', windowId: 1 }),
      makeChromeTab({ id: 3, url: 'https://b.com/x', windowId: 1 }),
      makeChromeTab({ id: 4, url: 'https://b.com/y', windowId: 1 }),
    ];

    const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
      Promise.resolve(arg.active ? [currentTab] : tabs),
    );
    // a.com 側は id を返さない不正なウィンドウ作成結果とする。
    const windowsCreate = vi.fn().mockResolvedValueOnce({}).mockResolvedValueOnce({ id: 101 });
    const windowsUpdate = vi.fn().mockResolvedValue(undefined);
    const move = vi.fn().mockResolvedValue(undefined);
    const update = vi.fn().mockResolvedValue(undefined);
    const get = vi.fn().mockResolvedValue({ id: 9, windowId: 1 });

    vi.stubGlobal('chrome', {
      tabs: { query, move, update, get },
      windows: { create: windowsCreate, update: windowsUpdate },
    });

    await runCategorize({ saveData });
    await flushPromises();

    // a.com は windowId が取れないため tabs.move/update が呼ばれない。
    expect(move).not.toHaveBeenCalledWith(2, expect.anything());
    // b.com 側は通常どおり処理される。
    expect(move).toHaveBeenCalledWith(4, { windowId: 101, index: -1 });
  });
});
