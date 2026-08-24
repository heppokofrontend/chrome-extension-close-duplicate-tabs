import { describe, it, expect, vi, afterEach } from 'vitest';

import { createChromeTabStub } from '@/__tests__/__helpers__';
import { runGather } from '@/contexts/worker/features/gather';
import type { SaveDataType } from '@/utils';

const saveData: SaveDataType = { includeAllWindow: false, includePinnedTabs: false };

/** 保留中の microtask を掃き出す（fire-and-forget な update を待つ）。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/** getCurrentTab（active:true）と getTabs を同じ query モックで分岐させる。 */
const stubChrome = (
  currentTab: chrome.tabs.Tab,
  tabs: chrome.tabs.Tab[],
  extra: {
    windowsCreate?: ReturnType<typeof vi.fn>;
    tabsGroup?: ReturnType<typeof vi.fn>;
    tabGroupsUpdate?: ReturnType<typeof vi.fn>;
  } = {},
) => {
  const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
    Promise.resolve(arg.active ? [currentTab] : tabs),
  );
  const move = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockResolvedValue(undefined);
  const windowsCreate = extra.windowsCreate ?? vi.fn().mockResolvedValue({ id: 100 });
  const group = extra.tabsGroup ?? vi.fn().mockResolvedValue(200);
  const tabGroupsUpdate = extra.tabGroupsUpdate ?? vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    tabs: { query, move, update, group },
    windows: { create: windowsCreate },
    tabGroups: { update: tabGroupsUpdate },
  });

  return { query, move, update, windowsCreate, group, tabGroupsUpdate };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runGather', () => {
  it('scope が allWindows のとき、全ウィンドウを対象に問い合わせる', async () => {
    const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
    const { query } = stubChrome(currentTab, []);

    await runGather({
      saveData,
      origin: 'https://a.com',
      scope: 'allWindows',
      destination: 'currentWindow',
    });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: undefined,
      pinned: false,
    });
  });

  it('scope が currentWindow のとき、現在のウィンドウのみを対象に問い合わせる', async () => {
    const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
    const { query } = stubChrome(currentTab, []);

    await runGather({
      saveData,
      origin: 'https://a.com',
      scope: 'currentWindow',
      destination: 'currentWindow',
    });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: false,
    });
  });

  it('一致するタブが無い場合は何もしない', async () => {
    const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
    const tabs = [createChromeTabStub({ id: 1, url: 'https://b.com/', windowId: 2 })];
    const { move, windowsCreate } = stubChrome(currentTab, tabs);

    await runGather({
      saveData,
      origin: 'https://a.com',
      scope: 'allWindows',
      destination: 'currentWindow',
    });

    expect(move).not.toHaveBeenCalled();
    expect(windowsCreate).not.toHaveBeenCalled();
  });

  describe('destination: currentWindow', () => {
    it('originが一致するタブだけを現在のウィンドウへ移動し、pinned 状態を保ってカレントタブへフォーカスを戻す', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2, pinned: true }),
        createChromeTabStub({ id: 2, url: 'https://a.com/y', windowId: 3, pinned: false }),
        createChromeTabStub({ id: 3, url: 'https://b.com/z', windowId: 4 }),
      ];
      const { move, update } = stubChrome(currentTab, tabs);

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'currentWindow',
      });

      expect(move.mock.calls).toStrictEqual([
        [1, { windowId: 1, index: -1 }],
        [2, { windowId: 1, index: -1 }],
      ]);
      expect(update).toHaveBeenCalledWith(1, { pinned: true });
      expect(update).toHaveBeenCalledWith(2, { pinned: false });
      expect(update).toHaveBeenCalledWith(99, { active: true });
    });

    it('url または id を持たない、または url が不正なタブは対象から除外する', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2 }),
        createChromeTabStub({ id: undefined, url: 'https://a.com/y', windowId: 3 }),
        createChromeTabStub({ id: 2, url: undefined, windowId: 4 }),
        createChromeTabStub({ id: 3, url: 'not a url', windowId: 5 }),
      ];
      const { move } = stubChrome(currentTab, tabs);

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'currentWindow',
      });

      expect(move.mock.calls).toStrictEqual([[1, { windowId: 1, index: -1 }]]);
    });
  });

  describe('destination: currentWindowGroup', () => {
    it('originが一致するタブを現在のウィンドウへ移動し、タブグループにまとめてホスト名をタイトルに設定する', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2 }),
        createChromeTabStub({ id: 2, url: 'https://a.com/y', windowId: 3 }),
        createChromeTabStub({ id: 3, url: 'https://b.com/z', windowId: 4 }),
      ];
      const { move, update, group, tabGroupsUpdate } = stubChrome(currentTab, tabs);

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'currentWindowGroup',
      });

      expect(move.mock.calls).toStrictEqual([
        [1, { windowId: 1, index: -1 }],
        [2, { windowId: 1, index: -1 }],
      ]);
      expect(group).toHaveBeenCalledWith({ tabIds: [1, 2], createProperties: { windowId: 1 } });
      expect(tabGroupsUpdate).toHaveBeenCalledWith(200, { title: 'a.com' });
      expect(update).toHaveBeenCalledWith(99, { active: true });
    });

    it('originにポート番号を含む場合、タイトルにもポート番号を保持する', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'http://localhost:8888/x', windowId: 2 }),
        createChromeTabStub({ id: 2, url: 'http://localhost:8888/y', windowId: 3 }),
      ];
      const { group, tabGroupsUpdate } = stubChrome(currentTab, tabs);

      await runGather({
        saveData,
        origin: 'http://localhost:8888',
        scope: 'allWindows',
        destination: 'currentWindowGroup',
      });

      expect(group).toHaveBeenCalledWith({ tabIds: [1, 2], createProperties: { windowId: 1 } });
      expect(tabGroupsUpdate).toHaveBeenCalledWith(200, { title: 'localhost:8888' });
    });

    it('ピン留めタブはピン留めを解除したうえでグループに含める', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2, pinned: true }),
      ];
      const { move, update, group, tabGroupsUpdate } = stubChrome(currentTab, tabs);

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'currentWindowGroup',
      });

      expect(move.mock.calls).toStrictEqual([[1, { windowId: 1, index: -1 }]]);
      expect(update).toHaveBeenCalledWith(1, { pinned: false });
      expect(group).toHaveBeenCalledWith({ tabIds: [1], createProperties: { windowId: 1 } });
      expect(tabGroupsUpdate).toHaveBeenCalledWith(200, { title: 'a.com' });
    });
  });

  describe('destination: newWindow', () => {
    it('先頭タブで新規ウィンドウを作り、残りのタブをそこへ移動する', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2, pinned: true }),
        createChromeTabStub({ id: 2, url: 'https://a.com/y', windowId: 3, pinned: false }),
      ];
      const windowsCreate = vi.fn().mockResolvedValue({ id: 100 });
      const { move, update } = stubChrome(currentTab, tabs, { windowsCreate });

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'newWindow',
      });
      await flushPromises();

      expect(windowsCreate).toHaveBeenCalledWith({ tabId: 1 });
      expect(move.mock.calls).toStrictEqual([[2, { windowId: 100, index: -1 }]]);
      expect(update).toHaveBeenCalledWith(1, { pinned: true });
      expect(update).toHaveBeenCalledWith(2, { pinned: false });
    });

    it('新規ウィンドウが数値の id を返さない場合、以降の移動処理をスキップする', async () => {
      const currentTab = createChromeTabStub({ id: 99, windowId: 1, active: true });
      const tabs = [
        createChromeTabStub({ id: 1, url: 'https://a.com/x', windowId: 2 }),
        createChromeTabStub({ id: 2, url: 'https://a.com/y', windowId: 3 }),
      ];
      const windowsCreate = vi.fn().mockResolvedValue({});
      const { move } = stubChrome(currentTab, tabs, { windowsCreate });

      await runGather({
        saveData,
        origin: 'https://a.com',
        scope: 'allWindows',
        destination: 'newWindow',
      });
      await flushPromises();

      expect(move).not.toHaveBeenCalled();
    });
  });
});
