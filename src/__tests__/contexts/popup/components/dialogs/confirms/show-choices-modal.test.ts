import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => key),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

/**
 * show-choices-modal はモジュールレベルで document.getElementById と getMessage を呼ぶため、
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

  return { ...module, dialogMocks: { showModal, close } };
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

describe('showChoicesModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('renders one button per command and resolves with the clicked one', async () => {
    const { showChoicesModal } = await loadModule();

    const promise = showChoicesModal({
      taskName: 'combine',
      commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle'],
    });
    const buttons = buttonsIn('#confirm-buttons');

    expect(buttons.map((b) => b.textContent)).toStrictEqual([
      'dialog_command_sortByUrl',
      'dialog_command_sortByTitle',
      'dialog_command_sortByHostAndTitle',
    ]);

    buttons[1]?.click();

    await expect(promise).resolves.toBe('sortByTitle');
  });
});
