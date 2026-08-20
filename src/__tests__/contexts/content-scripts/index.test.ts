import { afterEach, describe, expect, it, vi } from 'vitest';

const { initForcedChangeURLWhenClickedAnchorLink } = vi.hoisted(() => ({
  initForcedChangeURLWhenClickedAnchorLink: vi.fn(),
}));

vi.mock('@/contexts/content-scripts/features', () => ({
  initForcedChangeURLWhenClickedAnchorLink,
}));

/**
 * content-scripts/index はトップレベルで window に 'focus' の永続リスナーを張るモジュールのため、
 * resetModules を跨いでも window に実リスナーが積み上がらないよう addEventListener を横取りし、
 * 呼び出し元がリスナーを直接起動できるようにする。
 */
const loadContentScript = async () => {
  vi.resetModules();
  vi.clearAllMocks();

  const focusListeners: Array<() => void> = [];

  vi.spyOn(window, 'addEventListener').mockImplementation((type, listener) => {
    if (type === 'focus' && typeof listener === 'function') {
      focusListeners.push(listener as () => void);
    }
  });

  await import('@/contexts/content-scripts');

  const triggerFocus = () => {
    for (const listener of focusListeners) {
      listener();
    }
  };

  return { triggerFocus };
};

describe('content-scripts entry point', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('runs the registered features on initial load', async () => {
    await loadContentScript();

    expect(initForcedChangeURLWhenClickedAnchorLink).toHaveBeenCalledTimes(1);
  });

  it('re-runs the registered features when the window regains focus', async () => {
    const { triggerFocus } = await loadContentScript();

    triggerFocus();

    expect(initForcedChangeURLWhenClickedAnchorLink).toHaveBeenCalledTimes(2);
  });
});
