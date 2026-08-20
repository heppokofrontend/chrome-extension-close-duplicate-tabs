import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => key),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

/**
 * show-confirm-modal はモジュールレベルで document.getElementById と getMessage を呼ぶため、
 * DOM とスタブを整えてからモジュールを読み直す。
 */
const loadModule = async () => {
  vi.resetModules();
  getMessage.mockClear();

  document.body.innerHTML = `
    <dialog id="confirm">
      <p id="confirm-text"></p>
      <div id="confirm-controls"></div>
      <ul id="confirm-buttons"></ul>
    </dialog>
  `;

  const dialog = document.getElementById('confirm') as HTMLDialogElement;
  const showModal = vi.fn();
  const close = vi.fn(() => {
    dialog.dispatchEvent(new Event('close'));
  });

  dialog.showModal = showModal;
  dialog.close = close;

  const module = await import('@/contexts/popup/components/dialogs/confirms');
  const { STATE } = await import('@/contexts/popup/state');

  return { ...module, STATE, dialogMocks: { showModal, close } };
};

const requireElement = (selector: string) => {
  const element = document.querySelector(selector);

  if (!element) {
    throw new Error(`element not found: ${selector}`);
  }

  return element;
};

const buttonsIn = (selector: string) =>
  Array.from(requireElement(selector).querySelectorAll<HTMLButtonElement>('button'));

describe('showConfirmModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('resolves with confirm without opening the modal when noConfirm is on', async () => {
    const { showConfirmModal, STATE, dialogMocks } = await loadModule();

    STATE.saveData = { ...STATE.saveData, noConfirm: true };

    await expect(showConfirmModal({ message: 'remove confirm text' })).resolves.toBe('confirm');
    expect(dialogMocks.showModal).not.toHaveBeenCalled();
  });

  it('opens the modal and resolves with the clicked command', async () => {
    const { showConfirmModal, dialogMocks } = await loadModule();

    const promise = showConfirmModal({ message: 'remove confirm text' });

    expect(dialogMocks.showModal).toHaveBeenCalled();

    const confirmButton = buttonsIn('#confirm-buttons').find(
      (b) => b.textContent === 'dialog_command_confirm',
    );

    confirmButton?.click();

    await expect(promise).resolves.toBe('confirm');
    expect(dialogMocks.close).toHaveBeenCalled();
    expect(requireElement('#confirm-buttons').textContent).toBe('');
  });
});
