import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage, setSaveData } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => key),
  setSaveData: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage, setSaveData };
});

/**
 * dialogs のバレルはモジュールレベルで document 上の全 dialog を走査するため、
 * DOM とスタブを整えてからバレルを読み直す。
 */
const loadModule = async () => {
  vi.resetModules();
  getMessage.mockClear();
  setSaveData.mockClear();

  document.body.innerHTML = `
    <dialog id="notice">
      <p id="notice-text"></p>
      <p><button type="button" id="notice-close">OK</button></p>
    </dialog>
    <dialog id="confirm">
      <p id="confirm-text"></p>
      <ul id="dialog-buttons"></ul>
    </dialog>
  `;

  const notice = document.getElementById('notice') as HTMLDialogElement;
  const confirm = document.getElementById('confirm') as HTMLDialogElement;

  notice.close = vi.fn();
  confirm.showModal = vi.fn();
  confirm.close = vi.fn();

  await import('@/contexts/popup/components/dialogs');

  return { notice, confirm };
};

const dispatchKeydown = (target: EventTarget, key: string) => {
  const event = new KeyboardEvent('keydown', { key, cancelable: true });

  target.dispatchEvent(event);

  return event;
};

describe('dialogs barrel: Escape のポップアップ閉じ抑止', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('preventDefault してポップアップ自体が閉じるのを防ぐ', async () => {
    const { confirm, notice } = await loadModule();

    expect(dispatchKeydown(confirm, 'Escape').defaultPrevented).toBe(true);
    expect(dispatchKeydown(notice, 'Escape').defaultPrevented).toBe(true);
  });

  it('Escape 以外のキーには反応しない', async () => {
    const { confirm } = await loadModule();

    expect(dispatchKeydown(confirm, 'Enter').defaultPrevented).toBe(false);
  });
});
