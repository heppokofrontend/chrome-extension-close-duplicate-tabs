import { describe, it, expect, vi, afterEach } from 'vitest';

import { registerUpdateBadgeListeners } from '@/contexts/worker/features/update-badge';
import type { SaveDataType } from '@/utils';

type Listener = (...args: unknown[]) => void;

interface MockTab {
  id: number;
  url: string;
  windowId: number;
  pinned?: boolean;
}

const createChromeMock = ({
  saveData,
  currentTab,
  tabs,
}: {
  saveData: Partial<SaveDataType>;
  currentTab: MockTab | undefined;
  tabs: MockTab[];
}) => {
  const listeners = {
    onCreated: [] as Listener[],
    onRemoved: [] as Listener[],
    onUpdated: [] as Listener[],
    onActivated: [] as Listener[],
    onAttached: [] as Listener[],
    onDetached: [] as Listener[],
    onReplaced: [] as Listener[],
    onFocusChanged: [] as Listener[],
    onStorageChanged: [] as Listener[],
  };

  const mocks = {
    query: vi.fn((arg: chrome.tabs.QueryInfo) => {
      if (arg.active) {
        return Promise.resolve(currentTab ? [currentTab] : []);
      }

      return Promise.resolve(tabs);
    }),
    get: vi.fn().mockResolvedValue({ saveData }),
    setBadgeText: vi.fn().mockResolvedValue(undefined),
    setBadgeBackgroundColor: vi.fn().mockResolvedValue(undefined),
  };

  const chrome = {
    action: {
      setBadgeText: mocks.setBadgeText,
      setBadgeBackgroundColor: mocks.setBadgeBackgroundColor,
    },
    tabs: {
      query: mocks.query,
      onCreated: { addListener: (l: Listener) => listeners.onCreated.push(l) },
      onRemoved: { addListener: (l: Listener) => listeners.onRemoved.push(l) },
      onUpdated: { addListener: (l: Listener) => listeners.onUpdated.push(l) },
      onActivated: { addListener: (l: Listener) => listeners.onActivated.push(l) },
      onAttached: { addListener: (l: Listener) => listeners.onAttached.push(l) },
      onDetached: { addListener: (l: Listener) => listeners.onDetached.push(l) },
      onReplaced: { addListener: (l: Listener) => listeners.onReplaced.push(l) },
    },
    windows: {
      onFocusChanged: { addListener: (l: Listener) => listeners.onFocusChanged.push(l) },
    },
    storage: {
      local: { get: mocks.get },
      onChanged: { addListener: (l: Listener) => listeners.onStorageChanged.push(l) },
    },
  };

  vi.stubGlobal('chrome', chrome);

  return { listeners, mocks };
};

/** Flushes pending microtasks so the async badge update has time to complete. */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('registerUpdateBadgeListeners', () => {
  it('sets the badge background color on registration and runs the initial update', async () => {
    const { mocks } = createChromeMock({
      saveData: { updateBadgeMode: 'none' },
      currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
      tabs: [],
    });

    registerUpdateBadgeListeners();
    await flushPromises();

    expect(mocks.setBadgeBackgroundColor).toHaveBeenCalledWith({ color: '#c62828' });
    expect(mocks.setBadgeText).toHaveBeenCalledWith({ text: '' });
  });

  describe('updateBadgeMode: none', () => {
    it('does not query tabs and clears the badge', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'none' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [
          { id: 1, url: 'https://a.com/', windowId: 1 },
          { id: 2, url: 'https://a.com/', windowId: 1 },
        ],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.setBadgeText).toHaveBeenCalledWith({ text: '' });
    });
  });

  describe('updateBadgeMode: current', () => {
    it('shows the count of other tabs whose normalized URL matches the current tab', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'current' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [
          { id: 9, url: 'https://a.com/', windowId: 1 },
          { id: 1, url: 'https://a.com/', windowId: 1 },
          { id: 2, url: 'https://a.com/', windowId: 1 },
          { id: 3, url: 'https://b.com/', windowId: 1 },
        ],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '2' });
    });

    it('clears the badge when there is no duplicate', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'current' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [
          { id: 9, url: 'https://a.com/', windowId: 1 },
          { id: 3, url: 'https://b.com/', windowId: 1 },
        ],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '' });
    });

    it('counts duplicates honoring the URL normalize option (ignoreHash)', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'current', ignoreHash: true },
        currentTab: { id: 9, url: 'https://a.com/page#top', windowId: 1 },
        tabs: [
          { id: 9, url: 'https://a.com/page#top', windowId: 1 },
          // With ignoreHash: true, a differing hash still counts as the same URL.
          { id: 1, url: 'https://a.com/page#section', windowId: 1 },
          { id: 2, url: 'https://a.com/other', windowId: 1 },
        ],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '1' });
    });

    it('clears the badge when the current tab cannot be found', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'current' },
        currentTab: undefined,
        tabs: [{ id: 1, url: 'https://a.com/', windowId: 1 }],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '' });
    });
  });

  describe('updateBadgeMode: all', () => {
    it('shows the total number of tabs that "close duplicate tabs" would close', async () => {
      const { mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'all' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [
          // a.com x3 (including current) -> the 2 that aren't current get closed
          { id: 9, url: 'https://a.com/', windowId: 1 },
          { id: 1, url: 'https://a.com/', windowId: 1 },
          { id: 2, url: 'https://a.com/', windowId: 1 },
          // b.com x2 -> 1 gets closed
          { id: 3, url: 'https://b.com/', windowId: 1 },
          { id: 4, url: 'https://b.com/', windowId: 1 },
          // c.com x1 -> no duplicate
          { id: 5, url: 'https://c.com/', windowId: 1 },
        ],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '3' });
    });
  });

  describe('update race conditions', () => {
    it('does not overwrite the badge with a stale update that resolves late', async () => {
      const { listeners, mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'current' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [
          { id: 9, url: 'https://a.com/', windowId: 1 },
          { id: 1, url: 'https://a.com/', windowId: 1 },
          { id: 2, url: 'https://a.com/', windowId: 1 },
        ],
      });

      // Hold back only the first (initial, on-registration) saveData fetch, so it resolves out of order.
      let releaseFirst = () => {};

      mocks.get.mockImplementationOnce(
        () =>
          new Promise((resolve) => {
            releaseFirst = () => {
              resolve({ saveData: { updateBadgeMode: 'none' } });
            };
          }),
      );

      registerUpdateBadgeListeners();
      await flushPromises();

      // The second update (triggered by onCreated) resolves first and writes '2'.
      for (const l of listeners.onCreated) {
        l();
      }
      await flushPromises();

      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '2' });

      const callsBeforeRelease = mocks.setBadgeText.mock.calls.length;

      // Even though the first update resolves late, its stale result (none -> empty text) must not overwrite the badge.
      releaseFirst();
      await flushPromises();

      expect(mocks.setBadgeText.mock.calls.length).toBe(callsBeforeRelease);
      expect(mocks.setBadgeText).toHaveBeenLastCalledWith({ text: '2' });
    });
  });

  describe('re-updating on events', () => {
    it('re-updates on tab create/remove/activate/attach/detach/replace, window focus change, and settings change', async () => {
      const { listeners, mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'none' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      const initialCalls = mocks.setBadgeText.mock.calls.length;
      const fire = async (group: Listener[], ...args: unknown[]) => {
        for (const l of group) {
          l(...args);
        }
        await flushPromises();
      };

      await fire(listeners.onCreated);
      await fire(listeners.onRemoved);
      await fire(listeners.onActivated);
      await fire(listeners.onAttached);
      await fire(listeners.onDetached);
      await fire(listeners.onReplaced);
      await fire(listeners.onFocusChanged);
      await fire(listeners.onUpdated, 1, { url: 'https://a.com/' });
      await fire(listeners.onUpdated, 1, { pinned: true });
      await fire(listeners.onStorageChanged, { saveData: {} }, 'local');

      expect(mocks.setBadgeText.mock.calls.length).toBe(initialCalls + 10);
    });

    it('does not update on onUpdated events unrelated to URL/pinned, or storage changes unrelated to saveData', async () => {
      const { listeners, mocks } = createChromeMock({
        saveData: { updateBadgeMode: 'none' },
        currentTab: { id: 9, url: 'https://a.com/', windowId: 1 },
        tabs: [],
      });

      registerUpdateBadgeListeners();
      await flushPromises();

      const initialCalls = mocks.setBadgeText.mock.calls.length;

      for (const l of listeners.onUpdated) {
        l(1, { status: 'complete' });
      }
      for (const l of listeners.onStorageChanged) {
        l({ other: {} }, 'local');
      }
      for (const l of listeners.onStorageChanged) {
        l({ saveData: {} }, 'session');
      }
      await flushPromises();

      expect(mocks.setBadgeText.mock.calls.length).toBe(initialCalls);
    });
  });
});
