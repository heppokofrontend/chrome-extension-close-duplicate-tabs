import { afterEach, describe, expect, it, vi } from 'vitest';

import { initForcedChangeURLWhenClickedAnchorLink } from '@/contexts/content-scripts/features/forced-change-url-when-clicked-anchor-link';

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

const stubSaveData = (forcedChangeURLWhenClickedAnchorLink: boolean) =>
  vi.fn().mockResolvedValue({ saveData: { forcedChangeURLWhenClickedAnchorLink } });

/** jsdom は <a> クリックの既定動作としてページ遷移を試みる（未実装の警告が出る）ので、テストでは抑止する。 */
const click = (target: Element) => {
  const event = new MouseEvent('click', { bubbles: true, cancelable: true });
  target.addEventListener(
    'click',
    (e) => {
      e.preventDefault();
    },
    { once: true },
  );
  target.dispatchEvent(event);
};

describe('initForcedChangeURLWhenClickedAnchorLink', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    document.body.innerHTML = '';
  });

  it('rewrites the URL via pushState when clicking a hash link and the option is enabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(true) } } });

    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');
    click(document.getElementById('anchor') as HTMLAnchorElement);

    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });

  it('rewrites the URL when clicking a descendant of a hash link', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section"><span>link</span></a>';
    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(true) } } });

    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');
    click(document.querySelector('span') as HTMLSpanElement);

    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });

  it('does not touch the URL when clicking a non-hash link', async () => {
    document.body.innerHTML = '<a id="anchor" href="https://example.com">link</a>';
    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(true) } } });

    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');
    click(document.getElementById('anchor') as HTMLAnchorElement);

    expect(pushState).not.toHaveBeenCalled();
  });

  it('does not touch the URL when clicking outside any anchor', async () => {
    document.body.innerHTML = '<div id="plain">not a link</div>';
    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(true) } } });

    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');
    click(document.getElementById('plain') as HTMLDivElement);

    expect(pushState).not.toHaveBeenCalled();
  });

  it('does not touch the URL when the option is disabled', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(false) } } });

    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    const pushState = vi.spyOn(history, 'pushState');
    click(document.getElementById('anchor') as HTMLAnchorElement);

    expect(pushState).not.toHaveBeenCalled();
  });

  it('re-evaluates the click listener against the latest saved option on each run', async () => {
    document.body.innerHTML = '<a id="anchor" href="#section">link</a>';
    const anchor = document.getElementById('anchor') as HTMLAnchorElement;
    const pushState = vi.spyOn(history, 'pushState');

    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(false) } } });
    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    click(anchor);
    expect(pushState).not.toHaveBeenCalled();

    vi.stubGlobal('chrome', { storage: { local: { get: stubSaveData(true) } } });
    initForcedChangeURLWhenClickedAnchorLink();
    await flushPromises();

    click(anchor);
    expect(pushState).toHaveBeenCalledWith(null, '', expect.stringContaining('#section'));
  });
});
