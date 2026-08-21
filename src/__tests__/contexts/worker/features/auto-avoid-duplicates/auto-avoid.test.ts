import { describe, it, expect, vi, afterEach } from 'vitest';

const makeTab = (overrides: Partial<chrome.tabs.Tab> = {}): chrome.tabs.Tab => ({
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

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

const stubChrome = ({
  saveData,
  existingTabs,
  freshCreatedTab,
  targetWindowFocused = false,
}: {
  saveData: { autoAvoidDuplicate: boolean; [key: string]: unknown };
  existingTabs: chrome.tabs.Tab[];
  freshCreatedTab: chrome.tabs.Tab | null;
  targetWindowFocused?: boolean;
}) => {
  const onStartup = { addListener: vi.fn() };
  const onCreated = { addListener: vi.fn() };
  const onRemoved = { addListener: vi.fn() };
  const onUpdated = { addListener: vi.fn() };

  const storageGet = vi.fn().mockResolvedValue({ saveData });
  const query = vi.fn().mockResolvedValue(existingTabs);
  const get = freshCreatedTab
    ? vi.fn().mockResolvedValue(freshCreatedTab)
    : vi.fn().mockRejectedValue(new Error('no such tab'));
  const move = vi.fn().mockResolvedValue(undefined);
  const update = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const windowsGet = vi.fn().mockResolvedValue({ focused: targetWindowFocused });
  const windowsUpdate = vi.fn().mockResolvedValue(undefined);

  vi.stubGlobal('chrome', {
    runtime: { onStartup },
    storage: { local: { get: storageGet } },
    tabs: { onCreated, onRemoved, onUpdated, query, get, move, update, remove },
    windows: { get: windowsGet, update: windowsUpdate },
  });

  return {
    listeners: { onStartup, onCreated, onRemoved, onUpdated },
    mocks: { storageGet, query, get, move, update, remove, windowsGet, windowsUpdate },
  };
};

type Listener<Args extends unknown[]> = (...args: Args) => void;

const getListener = <Args extends unknown[]>(addListener: {
  mock: { calls: Listener<Args>[][] };
}) => addListener.mock.calls[0]?.[0] as Listener<Args>;

/**
 * auto-avoid はモジュールレベルで unresolvedTabIds / processingTabIds / extensionStartedAt を
 * 保持し、import 時点で chrome.runtime.onStartup.addListener を呼ぶ。そのため chrome のスタブを
 * 済ませてから毎回モジュールを読み直す。
 */
const loadRegisterAutoAvoidListeners = async () => {
  vi.resetModules();

  const { registerAutoAvoidListeners } =
    await import('@/contexts/worker/features/auto-avoid-duplicates/auto-avoid');

  return registerAutoAvoidListeners;
};

describe('registerAutoAvoidListeners', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('closes the new tab when it duplicates the already-active tab in its window', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1, active: false }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.move).not.toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith(2);
  });

  it('moves the duplicate next to the current tab before closing the new one when they differ', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [
        makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: false }),
        makeTab({ id: 3, url: 'https://other.com/', windowId: 1, active: true, index: 4 }),
      ],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1, active: false }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.move).toHaveBeenCalledWith(1, { windowId: 1, index: 5 });
    expect(mocks.remove).toHaveBeenCalledWith(2);
  });

  it('activates the existing duplicate and closes the new tab when the new tab was itself activated', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: false })],
      freshCreatedTab: makeTab({
        id: 2,
        url: 'https://dup.com/',
        windowId: 1,
        active: true,
        index: 2,
      }),
      targetWindowFocused: true,
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.move).toHaveBeenCalledWith(1, { windowId: 1, index: 3 });
    expect(mocks.update).toHaveBeenCalledWith(1, { active: true });
    expect(mocks.windowsUpdate).not.toHaveBeenCalled();
    expect(mocks.remove).toHaveBeenCalledWith(2);
  });

  it('focuses the target window when it is not the focused window', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: false })],
      freshCreatedTab: makeTab({
        id: 2,
        url: 'https://dup.com/',
        windowId: 1,
        active: true,
        index: 2,
      }),
      targetWindowFocused: false,
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.windowsUpdate).toHaveBeenCalledWith(1, { focused: true });
  });

  it('does nothing when autoAvoidDuplicate is off', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: false },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('does nothing when there is no duplicate', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://unique.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('skips resolution when the new tab already closed before the check', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: null,
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2, url: 'https://dup.com/' }));
    await flushPromises();

    expect(mocks.move).not.toHaveBeenCalled();
    expect(mocks.remove).not.toHaveBeenCalled();
  });

  it('ignores updates without a url change', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { status: 'loading' }, makeTab({ id: 2 }));
    await flushPromises();

    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('ignores tabs whose protocol is not targetable', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [],
      freshCreatedTab: makeTab({ id: 2, url: 'chrome://newtab/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onUpdated(2, { url: 'chrome://newtab/' }, makeTab({ id: 2 }));
    await flushPromises();

    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('forgets a tab once it is removed, so a later update for it is ignored', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onRemoved = getListener<[number]>(listeners.onRemoved.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onCreated({ id: 2 });
    onRemoved(2);
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2 }));
    await flushPromises();

    expect(mocks.storageGet).not.toHaveBeenCalled();
  });

  it('suppresses newly created tabs during the post-startup grace period', async () => {
    const { listeners, mocks } = stubChrome({
      saveData: { autoAvoidDuplicate: true },
      existingTabs: [makeTab({ id: 1, url: 'https://dup.com/', windowId: 1, active: true })],
      freshCreatedTab: makeTab({ id: 2, url: 'https://dup.com/', windowId: 1 }),
    });
    const registerAutoAvoidListeners = await loadRegisterAutoAvoidListeners();

    registerAutoAvoidListeners();

    const onStartup = getListener<[]>(listeners.onStartup.addListener);
    const onCreated = getListener<[{ id: number }]>(listeners.onCreated.addListener);
    const onUpdated = getListener<[number, chrome.tabs.OnUpdatedInfo, chrome.tabs.Tab]>(
      listeners.onUpdated.addListener,
    );

    onStartup();
    onCreated({ id: 2 });
    onUpdated(2, { url: 'https://dup.com/' }, makeTab({ id: 2 }));
    await flushPromises();

    expect(mocks.storageGet).not.toHaveBeenCalled();
  });
});
