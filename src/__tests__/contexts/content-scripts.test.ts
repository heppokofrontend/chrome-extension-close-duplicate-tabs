import { afterEach, describe, expect, it, vi } from 'vitest';

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

type ListenersByType = Record<string, Array<(e: Event) => void>>;

/**
 * content-scripts はトップレベルで window に 'focus'/'click' の永続リスナーを張るモジュールのため、
 * resetModules を跨いでも window に実リスナーが積み上がらないよう add/removeEventListener を横取りし、
 * 呼び出し元がリスナーを直接起動できるようにする（chrome スタブを整えてからモジュールを読み直す）。
 */
const loadContentScript = async (
  get: ReturnType<typeof vi.fn> = vi.fn().mockResolvedValue({ saveData: {} }),
) => {
  vi.resetModules();

  const listeners: ListenersByType = { focus: [], click: [] };

  vi.stubGlobal('chrome', { storage: { local: { get } } });
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
    if (typeof listener === 'function' && type in listeners) {
      listeners[type]?.push(listener);
    }
  });
  vi.spyOn(window, 'removeEventListener').mockImplementation((type, listener) => {
    if (type in listeners) {
      listeners[type] = (listeners[type] ?? []).filter((l) => l !== listener);
    }
  });

  await import('@/contexts/content-scripts');
  await flushPromises();

  const clickAnchor = (target: Element) => {
    const event = new MouseEvent('click', { bubbles: true, cancelable: true });
    Object.defineProperty(event, 'target', { value: target, enumerable: true });

    for (const listener of listeners['click'] ?? []) {
      listener(event);
    }
  };

  const triggerFocus = async () => {
    for (const listener of listeners['focus'] ?? []) {
      listener(new Event('focus'));
    }
    await flushPromises();
  };

  return { clickAnchor, triggerFocus };
};

describe('content-scripts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  const stubSaveData = (forcedChangeURLWhenClickedAnchorLink: boolean) =>
    vi.fn().mockResolvedValue({ saveData: { forcedChangeURLWhenClickedAnchorLink } });

  it('rewrites the URL via pushState when clicking a hash link and the option is enabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    const { clickAnchor } = await loadContentScript(stubSaveData(true));

    const pushState = vi.spyOn(history, 'pushState');
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;

    clickAnchor(anchor);

    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });

  it('rewrites the URL when clicking a descendant of a hash link', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section"><span>link</span></a>';
    const { clickAnchor } = await loadContentScript(stubSaveData(true));

    const pushState = vi.spyOn(history, 'pushState');
    const span = document.querySelector('span') as HTMLSpanElement;

    clickAnchor(span);

    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });

  it('does not touch the URL when the option is disabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    const { clickAnchor } = await loadContentScript(stubSaveData(false));

    const pushState = vi.spyOn(history, 'pushState');
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;

    clickAnchor(anchor);

    expect(pushState).not.toHaveBeenCalled();
  });

  it('re-evaluates anchors (and picks up option changes) when the window regains focus', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';

    const get = vi
      .fn()
      .mockResolvedValueOnce({ saveData: { forcedChangeURLWhenClickedAnchorLink: false } })
      .mockResolvedValueOnce({ saveData: { forcedChangeURLWhenClickedAnchorLink: true } });
    const { clickAnchor, triggerFocus } = await loadContentScript(get);

    const pushState = vi.spyOn(history, 'pushState');
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;

    clickAnchor(anchor);
    expect(pushState).not.toHaveBeenCalled();

    await triggerFocus();

    clickAnchor(anchor);
    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });
});
