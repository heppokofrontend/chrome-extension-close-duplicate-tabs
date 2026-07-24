import { describe, it, expect, vi, afterEach } from 'vitest';

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

const saveData: SaveDataType = {
  includeAllWindow: false,
  includePinnedTabs: false,
  ignoreHash: true,
};

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/**
 * remove-duplicates はモジュールレベルで一覧ウィンドウ（duplicatedListWindow）を保持するため、
 * 毎回モジュールを読み直してテスト間の状態残留を防ぐ。
 */
const loadRunRemove = async () => {
  vi.resetModules();

  const { runRemove } = await import('@/contexts/worker/features/remove-duplicates');

  return runRemove;
};

/** 重複ページ表示経路用の chrome スタブ一式。 */
const stubChromeForDuplicatePage = ({
  currentTab,
  tabs,
  createdWindow,
}: {
  currentTab: chrome.tabs.Tab;
  tabs: chrome.tabs.Tab[];
  createdWindow: { id?: number; tabs?: { id: number }[] } | undefined;
}) => {
  const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
    Promise.resolve(arg.active ? [currentTab] : tabs),
  );
  const remove = vi.fn().mockResolvedValue(undefined);
  const reload = vi.fn().mockResolvedValue(undefined);
  const sessionSet = vi.fn().mockResolvedValue(undefined);
  const windowsGet = vi.fn((_id: number, cb: () => void) => {
    cb();
  });
  const windowsCreate = vi.fn().mockResolvedValue(createdWindow);
  const windowsUpdate = vi.fn((_id: number, _opts: chrome.windows.UpdateInfo, cb: () => void) => {
    cb();
  });

  // 実際の Chrome では lastError はコールバック実行中のみ設定される。
  // ここではテスト側で lastError を書き換えて「ウィンドウ無し／生存」の経路を切り替える。
  const runtime: { lastError: { message: string } | undefined } = {
    lastError: { message: 'no such window' },
  };
  const chrome = {
    runtime,
    tabs: { query, remove, reload },
    storage: { session: { set: sessionSet } },
    windows: { get: windowsGet, create: windowsCreate, update: windowsUpdate },
  };

  vi.stubGlobal('chrome', chrome);

  return {
    chrome,
    mocks: { query, remove, reload, sessionSet, windowsGet, windowsCreate, windowsUpdate },
  };
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runRemove', () => {
  describe('重複タブを閉じる（既定の経路）', () => {
    it('各正規化 URL につき最初の 1 つを残し、残りの重複タブを閉じる', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 1 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
        makeChromeTab({ id: 3, url: 'https://unique.com/', windowId: 1 }),
      ];
      const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
        Promise.resolve(arg.active ? [currentTab] : tabs),
      );
      const remove = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('chrome', { tabs: { query, remove } });

      const runRemove = await loadRunRemove();

      await runRemove({ saveData });

      expect(remove.mock.calls).toStrictEqual([[2]]);
    });

    it('重複がなければ何も閉じない', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 1 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://a.com/', windowId: 1 }),
        makeChromeTab({ id: 2, url: 'https://b.com/', windowId: 1 }),
      ];
      const query = vi.fn((arg: chrome.tabs.QueryInfo) =>
        Promise.resolve(arg.active ? [currentTab] : tabs),
      );
      const remove = vi.fn().mockResolvedValue(undefined);
      vi.stubGlobal('chrome', { tabs: { query, remove } });

      const runRemove = await loadRunRemove();

      await runRemove({ saveData });

      expect(remove).not.toHaveBeenCalled();
    });
  });

  describe('重複ページを表示する経路（shouldShowDuplicatePage）', () => {
    it('重複一覧を session storage へ保存し、既存ウィンドウが無ければ新規に開く', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 7 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 7 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 7 }),
      ];
      const { mocks } = stubChromeForDuplicatePage({
        currentTab,
        tabs,
        createdWindow: { id: 100 },
      });

      const runRemove = await loadRunRemove();

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.sessionSet).toHaveBeenCalledWith({
        lastWindowId: 7,
        duplicatedEntries: [['https://dup.com/', tabs]],
      });
      expect(mocks.windowsCreate).toHaveBeenCalledWith({
        url: 'duplicates-list.html',
        type: 'popup',
        width: 800,
        height: 800,
        left: 100,
        top: 100,
      });
      // 一覧表示経路ではタブを閉じない。
      expect(mocks.remove).not.toHaveBeenCalled();
      expect(mocks.reload).not.toHaveBeenCalled();
    });

    it('一覧ウィンドウが生存していれば再作成せず、フォーカスして中身をリロードする', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 7 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 7 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 7 }),
      ];
      const { chrome, mocks } = stubChromeForDuplicatePage({
        currentTab,
        tabs,
        createdWindow: { id: 100, tabs: [{ id: 55 }] },
      });

      const runRemove = await loadRunRemove();

      // 1回目：lastError あり → 一覧ウィンドウを作成させ、モジュール内に保持させる。
      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsCreate).toHaveBeenCalledTimes(1);

      // 2回目：ウィンドウ生存（lastError なし）→ フォーカス + リロード経路。
      chrome.runtime.lastError = undefined;

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsCreate).toHaveBeenCalledTimes(1);
      expect(mocks.windowsGet).toHaveBeenLastCalledWith(100, expect.any(Function));
      expect(mocks.windowsUpdate).toHaveBeenCalledWith(
        100,
        { focused: true, state: 'normal' },
        expect.any(Function),
      );
      expect(mocks.reload).toHaveBeenCalledWith(55, { bypassCache: false });
    });

    it('falls back to null when windows.create resolves a falsy value', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 7 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 7 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 7 }),
      ];
      const { chrome, mocks } = stubChromeForDuplicatePage({
        currentTab,
        tabs,
        createdWindow: undefined,
      });

      const runRemove = await loadRunRemove();

      // 1回目：lastError あり → 新規作成。create が偽値を返すため duplicatedListWindow は null のまま。
      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsCreate).toHaveBeenCalledTimes(1);

      // 2回目：ウィンドウ生存扱いにしても、保持している duplicatedListWindow が null なので
      // targetWindowId は number にならず、フォーカス／リロードへは進まない。
      chrome.runtime.lastError = undefined;

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsUpdate).not.toHaveBeenCalled();
      expect(mocks.reload).not.toHaveBeenCalled();
    });

    it('skips focusing/reloading when the kept window has no numeric id', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 7 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 7 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 7 }),
      ];
      const { chrome, mocks } = stubChromeForDuplicatePage({
        currentTab,
        tabs,
        createdWindow: {},
      });

      const runRemove = await loadRunRemove();

      // 1回目：lastError あり → 新規作成。create が id を持たないオブジェクトを返す。
      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsCreate).toHaveBeenCalledTimes(1);

      // 2回目：ウィンドウ生存扱い → だが id が number でないため、フォーカス／リロードには進まない。
      chrome.runtime.lastError = undefined;

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsUpdate).not.toHaveBeenCalled();
      expect(mocks.reload).not.toHaveBeenCalled();
    });

    it('focuses the surviving window but skips reload when it has no tabs yet', async () => {
      const currentTab = makeChromeTab({ id: 9, url: 'https://other.com/', windowId: 7 });
      const tabs = [
        makeChromeTab({ id: 1, url: 'https://dup.com/', windowId: 7 }),
        makeChromeTab({ id: 2, url: 'https://dup.com/', windowId: 7 }),
      ];
      const { chrome, mocks } = stubChromeForDuplicatePage({
        currentTab,
        tabs,
        createdWindow: { id: 100, tabs: [] },
      });

      const runRemove = await loadRunRemove();

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      chrome.runtime.lastError = undefined;

      await runRemove({ saveData, shouldShowDuplicatePage: true });
      await flushPromises();

      expect(mocks.windowsUpdate).toHaveBeenCalledWith(
        100,
        { focused: true, state: 'normal' },
        expect.any(Function),
      );
      expect(mocks.reload).not.toHaveBeenCalled();
    });
  });
});
