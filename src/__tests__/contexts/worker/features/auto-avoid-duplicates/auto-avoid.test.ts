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

/** Flushes pending microtasks so async side effects have time to complete. */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/**
 * auto-avoid registers chrome.runtime.onStartup at module evaluation time, so
 * stub chrome and re-import the module fresh every time.
 */
const setup = async (
  saveData: Partial<SaveDataType>,
  existingTabs: MockTab[],
  windowFocused = true,
) => {
  const { chrome, listeners, mocks } = createChromeMock(saveData, existingTabs, windowFocused);

  vi.stubGlobal('chrome', chrome);
  vi.resetModules();

  const { registerAutoAvoidListeners } =
    await import('@/contexts/worker/features/auto-avoid-duplicates');

  registerAutoAvoidListeners();

  return { listeners, mocks };
};

/** Fires onCreated then onUpdated, in order, to run the check as a URL-resolved tab. */
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
  describe('active new duplicate tab', () => {
    it('moves the existing tab next to the new tab and activates it before closing the new tab', async () => {
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

    it('does not steal focus when the target window is not focused', async () => {
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

  describe('non-active new duplicate tab (opened in the background)', () => {
    it('moves the existing tab next to the current tab and closes the new tab, when the duplicate is not the current tab', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: false }, // kept
        { id: 9, url: 'https://other.com/', windowId: 1, index: 2, active: true }, // current tab
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
      // Opened in the background, so focus is not stolen.
      expect(mocks.update).not.toHaveBeenCalled();
      expect(mocks.windowsUpdate).not.toHaveBeenCalled();
    });

    it('just closes the new tab without moving anything, when the duplicate is the current tab itself', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true }, // current tab, also kept
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

  describe('cases with no side effects', () => {
    it('does nothing when autoAvoidDuplicate is disabled', async () => {
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

    it('does nothing when there is no duplicate', async () => {
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

    it('does not check tabs with a non-targetable protocol (chrome:)', async () => {
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

    it('does not check a tab that never went through onCreated (e.g. navigating via the URL bar)', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      // Fire only onUpdated, without firing onCreated first.
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

    it('does not track a tab created during the startup grace period', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      // Set the startup time to "now", putting us inside the grace period.
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

    it('ignores tab creation events without a numeric id', async () => {
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, []);

      for (const l of listeners.onCreated) {
        l({ id: undefined });
      }
      await flushPromises();

      expect(mocks.query).not.toHaveBeenCalled();
    });

    it('cleans up tracked state when a tab is removed before its create/update flow completes', async () => {
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, []);

      for (const l of listeners.onCreated) {
        l({ id: 5 });
      }
      for (const l of listeners.onRemoved) {
        l(5);
      }
      // The removed tab id was dropped from tracking, so a late onUpdated for it is a no-op.
      for (const l of listeners.onUpdated) {
        l(
          5,
          { url: 'https://a.com/' },
          { id: 5, url: 'https://a.com/', windowId: 1, index: 0, active: true },
        );
      }
      await flushPromises();

      expect(mocks.query).not.toHaveBeenCalled();
    });

    it('skips re-entrant processing when the same tab id is already being resolved', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: false },
      ];
      const { listeners, mocks } = await setup({ autoAvoidDuplicate: true }, existingTabs);

      for (const l of listeners.onCreated) {
        l({ id: 2 });
      }
      for (const l of listeners.onUpdated) {
        l(
          2,
          { url: 'https://a.com/' },
          { id: 2, url: 'https://a.com/', windowId: 1, index: 3, active: false },
        );
      }

      // Let the first resolveCreatedTab(2) chain progress past the getSaveData await, so it
      // has added id 2 to processingTabIds but has not reached its finally block yet.
      await Promise.resolve();
      await Promise.resolve();

      // Simulate the tab id being reused (a new create/update burst for the same id) while
      // the first resolution is still in-flight.
      for (const l of listeners.onCreated) {
        l({ id: 2 });
      }
      for (const l of listeners.onUpdated) {
        l(
          2,
          { url: 'https://a.com/' },
          { id: 2, url: 'https://a.com/', windowId: 1, index: 3, active: false },
        );
      }

      await flushPromises();

      // The re-entrant call bailed out immediately, so only one resolution went through.
      expect(mocks.remove).toHaveBeenCalledTimes(1);
      expect(mocks.remove).toHaveBeenCalledWith(2);
    });

    it('queries every window (not just the current one) when includeAllWindow is enabled', async () => {
      const existingTabs: MockTab[] = [
        { id: 1, url: 'https://a.com/', windowId: 1, index: 0, active: true },
      ];
      const { listeners, mocks } = await setup(
        { autoAvoidDuplicate: true, includeAllWindow: true },
        existingTabs,
      );

      await openTab(listeners, {
        id: 2,
        url: 'https://a.com/',
        windowId: 1,
        index: 3,
        active: false,
      });

      expect(mocks.query).toHaveBeenCalledWith({ windowType: 'normal' });
    });
  });
});
