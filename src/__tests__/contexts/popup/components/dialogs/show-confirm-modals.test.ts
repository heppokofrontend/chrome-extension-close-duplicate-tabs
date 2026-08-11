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
 * show-confirm-modals はモジュールレベルで document.getElementById と getMessage を呼ぶため、
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
      <ul id="dialog-buttons"></ul>
    </dialog>
  `;

  const dialog = document.getElementById('confirm') as HTMLDialogElement;
  const showModal = vi.fn();
  const close = vi.fn(() => {
    dialog.dispatchEvent(new Event('close'));
  });

  dialog.showModal = showModal;
  dialog.close = close;

  const module = await import('@/contexts/popup/components/dialogs/show-confirm-modals');
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

    await expect(showConfirmModal({ taskName: 'remove' })).resolves.toBe('confirm');
    expect(dialogMocks.showModal).not.toHaveBeenCalled();
  });

  it('opens the modal and resolves with the clicked command', async () => {
    const { showConfirmModal, dialogMocks } = await loadModule();

    const promise = showConfirmModal({ taskName: 'remove' });

    expect(dialogMocks.showModal).toHaveBeenCalled();

    const confirmButton = buttonsIn('#dialog-buttons').find(
      (b) => b.textContent === 'dialog_command_confirm',
    );

    confirmButton?.click();

    await expect(promise).resolves.toBe('confirm');
    expect(dialogMocks.close).toHaveBeenCalled();
    expect(requireElement('#dialog-buttons').textContent).toBe('');
  });
});

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
    const buttons = buttonsIn('#dialog-buttons');

    expect(buttons.map((b) => b.textContent)).toStrictEqual([
      'dialog_command_sortByUrl',
      'dialog_command_sortByTitle',
      'dialog_command_sortByHostAndTitle',
    ]);

    buttons[1]?.click();

    await expect(promise).resolves.toBe('sortByTitle');
  });
});

describe('showRangeModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  const changeInput = (valueAsNumber: number) => {
    const input = requireElement('#confirm-controls input') as HTMLInputElement;

    input.valueAsNumber = valueAsNumber;
    input.dispatchEvent(new Event('change'));

    return input;
  };

  const clickCommand = (command: 'apply' | 'cancel') => {
    buttonsIn('#dialog-buttons')
      .find((b) => b.textContent === `dialog_command_${command}`)
      ?.click();
  };

  it('keeps in-range values as-is and persists them', async () => {
    const { showRangeModal } = await loadModule();

    const promise = showRangeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(5);

    expect(input.valueAsNumber).toBe(5);
    expect(setSaveData).toHaveBeenCalledWith(expect.objectContaining({ minCategorizeNumber: 5 }));

    clickCommand('apply');

    await expect(promise).resolves.toBe(5);
  });

  it('clamps values above max down to max', async () => {
    const { showRangeModal } = await loadModule();

    void showRangeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(999);

    expect(input.valueAsNumber).toBe(10);
  });

  it('clamps values below min up to min', async () => {
    const { showRangeModal } = await loadModule();

    void showRangeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(-5);

    expect(input.valueAsNumber).toBe(1);
  });

  it('falls back to the previous value when the input is not a number', async () => {
    const { showRangeModal } = await loadModule();

    void showRangeModal({ taskName: 'categorize', min: 1, max: 10 });
    changeInput(7);
    setSaveData.mockClear();

    const input = changeInput(Number.NaN);

    expect(input.valueAsNumber).toBe(7);
    expect(setSaveData).toHaveBeenCalledWith(expect.objectContaining({ minCategorizeNumber: 7 }));
  });

  it('resolves with NaN when the modal is cancelled', async () => {
    const { showRangeModal } = await loadModule();

    const promise = showRangeModal({ taskName: 'categorize', min: 1, max: 10 });

    clickCommand('cancel');

    const result = await promise;

    expect(Number.isNaN(result)).toBe(true);
  });
});
