import { afterEach, describe, expect, it, vi } from 'vitest';

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/**
 * content-scripts はトップレベルで window の 'focus' に永続リスナーを張るモジュールのため、
 * resetModules を跨いでも window に実リスナーが積み上がらないよう addEventListener を横取りし、
 * 呼び出し元がリスナーを直接起動できるようにする（chrome スタブを整えてからモジュールを読み直す）。
 */
const loadContentScript = async (forcedChangeURLWhenClickedAnchorLink: boolean) => {
  vi.resetModules();

  const get = vi.fn().mockResolvedValue({ saveData: { forcedChangeURLWhenClickedAnchorLink } });
  const focusListeners: Array<() => void> = [];

  vi.stubGlobal('chrome', { storage: { local: { get } } });
  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
    if (type === 'focus' && typeof listener === 'function') {
      focusListeners.push(listener as () => void);
    }
  });

  await import('@/contexts/content-scripts');
  await flushPromises();

  const triggerFocus = async () => {
    for (const listener of focusListeners) {
      listener();
    }
    await flushPromises();
  };

  return { triggerFocus };
};

describe('content-scripts', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('rewrites the URL via pushState when clicking a hash link and the option is enabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    await loadContentScript(true);

    const pushState = vi.spyOn(history, 'pushState');

    document.getElementById('anchor')?.click();

    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });

  it('does not touch the URL when the option is disabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    await loadContentScript(false);

    const pushState = vi.spyOn(history, 'pushState');

    document.getElementById('anchor')?.click();

    expect(pushState).not.toHaveBeenCalled();
  });

  it('re-evaluates anchors (and picks up option changes) when the window regains focus', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';

    const get = vi
      .fn()
      .mockResolvedValueOnce({ saveData: { forcedChangeURLWhenClickedAnchorLink: false } })
      .mockResolvedValueOnce({ saveData: { forcedChangeURLWhenClickedAnchorLink: true } });

    vi.stubGlobal('chrome', { storage: { local: { get } } });
    vi.resetModules();
    await import('@/contexts/content-scripts');
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');

    document.getElementById('anchor')?.click();
    expect(pushState).not.toHaveBeenCalled();

    window.dispatchEvent(new Event('focus'));
    await flushPromises();

    document.getElementById('anchor')?.click();
    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });
});
