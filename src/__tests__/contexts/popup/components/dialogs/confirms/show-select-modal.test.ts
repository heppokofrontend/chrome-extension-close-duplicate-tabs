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
 * show-select-modal はモジュールレベルで document.getElementById と getMessage を呼ぶため、
 * DOM とスタブを整えてからモジュールを読み直す。
 */
const loadModule = async () => {
  vi.resetModules();
  getMessage.mockClear();
  setSaveData.mockClear();

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

describe('showSelectModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const selectsIn = () =>
    Array.from(requireElement('#confirm-controls').querySelectorAll<HTMLSelectElement>('select'));

  const clickCommand = (command: 'apply' | 'cancel') => {
    buttonsIn('#confirm-buttons')
      .find((b) => b.textContent === `dialog_command_${command}`)
      ?.click();
  };

  it('renders one select per field and resolves with the answers keyed by field', async () => {
    const { showSelectModal } = await loadModule();

    const promise = showSelectModal({
      taskName: 'gather',
      fields: [
        {
          key: 'origin',
          options: [
            { value: 'https://a.example.com', label: 'https://a.example.com' },
            { value: 'https://b.example.com', label: 'https://b.example.com' },
          ],
        },
        {
          key: 'destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
    const [originSelect, destinationSelect] = selectsIn();

    expect(
      Array.from(originSelect?.querySelectorAll<HTMLOptionElement>('option') ?? []).map(
        (o) => o.value,
      ),
    ).toStrictEqual(['https://a.example.com', 'https://b.example.com']);

    if (originSelect) {
      originSelect.value = 'https://b.example.com';
    }

    if (destinationSelect) {
      destinationSelect.value = 'newWindow';
    }

    clickCommand('apply');

    await expect(promise).resolves.toStrictEqual({
      origin: 'https://b.example.com',
      destination: 'newWindow',
    });
  });

  it('does not resolve when a select has an empty value', async () => {
    const { showSelectModal, dialogMocks } = await loadModule();

    void showSelectModal({
      taskName: 'gather',
      fields: [{ key: 'origin', options: [] }],
    });

    clickCommand('apply');

    expect(dialogMocks.close).not.toHaveBeenCalled();
  });

  it('resolves with cancel when the modal is cancelled', async () => {
    const { showSelectModal } = await loadModule();

    const promise = showSelectModal({
      taskName: 'gather',
      fields: [
        {
          key: 'origin',
          options: [{ value: 'https://a.example.com', label: 'https://a.example.com' }],
        },
      ],
    });

    clickCommand('cancel');

    await expect(promise).resolves.toBe('cancel');
  });
});
