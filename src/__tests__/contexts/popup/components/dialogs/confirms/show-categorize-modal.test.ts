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
 * show-range-modal はモジュールレベルで document.getElementById と getMessage を呼ぶため、
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

describe('showCategorizeModal', () => {
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
    buttonsIn('#confirm-buttons')
      .find((b) => b.textContent === `dialog_command_${command}`)
      ?.click();
  };

  it('keeps in-range values as-is and persists them', async () => {
    const { showCategorizeModal } = await loadModule();

    const promise = showCategorizeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(5);

    expect(input.valueAsNumber).toBe(5);
    expect(setSaveData).toHaveBeenCalledWith(expect.objectContaining({ minCategorizeNumber: 5 }));

    clickCommand('apply');

    await expect(promise).resolves.toBe(5);
  });

  it('clamps values above max down to max', async () => {
    const { showCategorizeModal } = await loadModule();

    void showCategorizeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(999);

    expect(input.valueAsNumber).toBe(10);
  });

  it('clamps values below min up to min', async () => {
    const { showCategorizeModal } = await loadModule();

    void showCategorizeModal({ taskName: 'categorize', min: 1, max: 10 });
    const input = changeInput(-5);

    expect(input.valueAsNumber).toBe(1);
  });

  it('falls back to the previous value when the input is not a number', async () => {
    const { showCategorizeModal } = await loadModule();

    void showCategorizeModal({ taskName: 'categorize', min: 1, max: 10 });
    changeInput(7);
    setSaveData.mockClear();

    const input = changeInput(Number.NaN);

    expect(input.valueAsNumber).toBe(7);
    expect(setSaveData).toHaveBeenCalledWith(expect.objectContaining({ minCategorizeNumber: 7 }));
  });

  it('resolves with NaN when the modal is cancelled', async () => {
    const { showCategorizeModal } = await loadModule();

    const promise = showCategorizeModal({ taskName: 'categorize', min: 1, max: 10 });

    clickCommand('cancel');

    const result = await promise;

    expect(Number.isNaN(result)).toBe(true);
  });
});
