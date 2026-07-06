import { describe, it, expect, vi, afterEach } from 'vitest';

import type { SaveDataType } from '@/utils';

type Listener = (...args: unknown[]) => void;

interface MockTab {
  id: number;
  url: string;
  windowId: number;
  index: number;
  active: boolean;
  pinned?: boolean;
}

const createChromeMock = (
  saveData: Partial<SaveDataType>,
  existingTabs: MockTab[],
  windowFocused = true,
) => {
  const listeners = {
    onStartup: [] as Listener[],
    onCreated: [] as Listener[],
    onRemoved: [] as Listener[],
    onUpdated: [] as Listener[],
  };

  const mocks = {
    query: vi.fn().mockResolvedValue(existingTabs),
    move: vi.fn().mockResolvedValue(undefined),
    update: vi.fn().mockResolvedValue(undefined),
    remove: vi.fn().mockResolvedValue(undefined),
    windowsGet: vi.fn().mockResolvedValue({ focused: windowFocused }),
    windowsUpdate: vi.fn().mockResolvedValue(undefined),
    get: vi.fn().mockResolvedValue({ saveData }),
  };

  const chrome = {
    runtime: {
      onStartup: { addListener: (l: Listener) => listeners.onStartup.push(l) },
    },
    tabs: {
      onCreated: { addListener: (l: Listener) => listeners.onCreated.push(l) },
      onRemoved: { addListener: (l: Listener) => listeners.onRemoved.push(l) },
      onUpdated: { addListener: (l: Listener) => listeners.onUpdated.push(l) },
      query: mocks.query,
      move: mocks.move,
      update: mocks.update,
      remove: mocks.remove,
    },
    storage: { local: { get: mocks.get } },
    windows: { get: mocks.windowsGet, update: mocks.windowsUpdate },
  };

  return { chrome, listeners, mocks };
};

/** 保留中の microtask を掃き出し、非同期の副作用が完了するのを待つ。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/**
 * auto-avoid はモジュール評価時に chrome.runtime.onStartup を登録するため、
 * chrome をスタブしたうえで毎回モジュールを読み直す。
 */
const setup = async (
  saveData: Partial<SaveDataType>,
  existingTabs: MockTab[],
  windowFocused = true,
) => {
  const { chrome, listeners, mocks } = createChromeMock(saveData, existingTabs, windowFocused);

  vi.stubGlobal('chrome', chrome);
  vi.resetModules();

  const { registerAutoAvoidListeners } = await import('@/worker/auto-avoid-duplicates/auto-avoid');

  registerAutoAvoidListeners();

  return { listeners, mocks };
};

/** onCreated → onUpdated の順で発火させ、URL 確定タブとして判定を走らせる。 */
const openTab = async (
  listeners: ReturnType<typeof createChromeMock>['listeners'],
  tab: MockTab,
) => {
  for (const l of listeners.onCreated) {
    l({ id: tab.id });
  }

  for (const l of listeners.onUpdated) {
    l(tab.id, { url: tab.url }, tab);
  }

  await flushPromises();
};

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('registerAutoAvoidListeners', () => {
  describe('active な新規重複タブ', () => {
    it('既存タブを新規タブの隣へ移動しアクティブ化してから新規タブを閉じる', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: false },
        { id: 2, url: 'https://a.com/', windowId: 1, index: 3, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.move).toHaveBeenCalledWith(1, { windowId: 1, index: 4 });
      expect(mocks.update).toHaveBeenCalledWith(1, { active: true });
      expect(mocks.windowsUpdate).toHaveBeenCalledWith(1, { focused: true });
      expect(mocks.remove).toHaveBeenCalledWith(2);
    });

    it('対象ウィンドウがフォーカスされていない場合はフォーカスを奪わない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: false },
        { id: 2, url: 'https://a.com/', windowId: 1, index: 3, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs, false);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.move).toHaveBeenCalledWith(1, { windowId: 1, index: 4 });
      expect(mocks.update).toHaveBeenCalledWith(1, { active: true });
      expect(mocks.windowsUpdate).not.toHaveBeenCalled();
      expect(mocks.remove).toHaveBeenCalledWith(2);
    });
  });

  describe('非active な新規重複タブ（バックグラウンドで開かれた）', () => {
    it('重複相手がカレントタブ以外なら、既存タブをカレントタブの隣へ移動してから新規タブを閉じる', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: false }, // keep 対象
        { id: 9, url: 'https://other.com/', windowId: 1, index: 2, active: true }, // カレント
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: false,
      });

      expect(mocks.move).toHaveBeenCalledWith(1, { windowId: 1, index: 3 });
      expect(mocks.remove).toHaveBeenCalledWith(2);
      // バックグラウンドで開かれたため、フォーカスは奪わない。
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.windowsUpdate).not.toHaveBeenCalled();
    });

    it('重複相手がカレントタブ自身なら、移動せず新規タブを閉じるだけ', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true }, // カレント かつ keep 対象
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: false,
      });

      expect(mocks.move).not.toHaveBeenCalled();
      expect(mocks.remove).toHaveBeenCalledWith(2);
    });
  });

  describe('副作用を起こさないケース', () => {
    it('autoAvoidDuplicate が無効なら何もしない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: false }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });

    it('重複が存在しなければ何もしない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://b.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.remove).not.toHaveBeenCalled();
    });

    it('対象外プロトコル（chrome:）は判定しない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'chrome://newtab/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      await openTab(listeners, {
        id: 2,
        url: 'chrome://newtab/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });

    it('onCreated を経ていないタブ（URL バー内 navigate）は判定しない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      // onCreated を発火させず onUpdated だけ発火させる。
      for (const l of listeners.onUpdated) {
        l(
          2,
          { url: 'https://a.com/' },
          { id: 2, url: 'https://a.com/', windowId: 1, index: 3, active: true },
        );
      }
      await flushPromises();

      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });

    it('起動直後の猶予期間中に作成されたタブは監視対象にしない', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      // 起動時刻を「今」に設定し、猶予期間内にする。
      for (const l of listeners.onStartup) {
        l();
      }

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: true,
      });

      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.remove).not.toHaveBeenCalled();
    });
  });
});
