import { afterEach, describe, expect, it, vi } from 'vitest';

const {
  registerAutoAvoidListeners,
  registerUpdateBadgeListeners,
  runCategorize,
  runCombine,
  runDivide,
  runGather,
  runReload,
  runRemove,
  runSort,
} = vi.hoisted(() => ({
  registerAutoAvoidListeners: vi.fn(),
  registerUpdateBadgeListeners: vi.fn(),
  runCategorize: vi.fn(),
  runCombine: vi.fn(),
  runDivide: vi.fn(),
  runGather: vi.fn(),
  runReload: vi.fn(),
  runRemove: vi.fn(),
  runSort: vi.fn(),
}));

vi.mock('@/contexts/worker/features', () => ({
  registerAutoAvoidListeners,
  registerUpdateBadgeListeners,
  runCategorize,
  runCombine,
  runDivide,
  runGather,
  runReload,
  runRemove,
  runSort,
}));

type Dispatch = (request: unknown) => void;

/**
 * worker/index.ts はトップレベルで chrome.runtime.onConnect.addListener を実行するモジュールのため、
 * chrome のスタブを整えてからモジュールを読み直し、port へ登録された onMessage リスナーを取り出す。
 */
const loadWorker = async () => {
  vi.resetModules();
  vi.clearAllMocks();

  const onMessageListeners: Dispatch[] = [];
  const port = {
    onMessage: {
      addListener: (listener: Dispatch) => {
        onMessageListeners.push(listener);
      },
    },
  };

  const onConnect = {
    addListener: vi.fn((cb: (fakePort: typeof port) => void) => {
      cb(port);
    }),
  };

  vi.stubGlobal('chrome', { runtime: { onConnect } });

  await import('@/contexts/worker/index');

  const dispatch = onMessageListeners[0];

  if (!dispatch) {
    throw new Error('onMessage listener was not registered');
  }

  return dispatch;
};

describe('worker entry point', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('registers the always-on background listeners at startup', async () => {
    await loadWorker();

    expect(registerAutoAvoidListeners).toHaveBeenCalledTimes(1);
    expect(registerUpdateBadgeListeners).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['remove', runRemove],
    ['reload', runReload],
    ['categorize', runCategorize],
    ['divide', runDivide],
    ['combine', runCombine],
    ['sort', runSort],
  ] as const)(
    'dispatches a "%s" task to its handler with the request options',
    async (taskName, handler) => {
      const dispatch = await loadWorker();
      const options = { some: 'options' };

      dispatch({ taskName, options });

      expect(handler).toHaveBeenCalledWith(options);
    },
  );

  it('dispatches a "gather" task by mapping the request options to runGather\'s param shape', async () => {
    const dispatch = await loadWorker();
    const options = {
      saveData: { includeAllWindow: true },
      origin: 'https://example.com',
      gatherScope: 'currentWindow',
      gatherDestination: 'newWindow',
    };

    dispatch({ taskName: 'gather', options });

    expect(runGather).toHaveBeenCalledWith({
      saveData: options.saveData,
      origin: options.origin,
      scope: options.gatherScope,
      destination: options.gatherDestination,
    });
  });
});
