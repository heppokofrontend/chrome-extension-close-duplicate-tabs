import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => key),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

/**
 * show-notice-modal はモジュールレベルで document.getElementById を呼ぶため、
 * DOM とスタブを整えてからモジュールを読み直す。
 */
const loadModule = async () => {
  vi.resetModules();
  getMessage.mockClear();

  document.body.innerHTML = `
    <dialog id="notice">
      <h2 id="notice-title"></h2>
      <p id="notice-text"></p>
      <p><button type="button" id="notice-close">OK</button></p>
    </dialog>
  `;

  const dialog = document.getElementById('notice') as HTMLDialogElement;
  const showModal = vi.fn();
  const close = vi.fn(() => {
    dialog.dispatchEvent(new Event('close'));
  });

  dialog.showModal = showModal;
  dialog.close = close;

  const { showNoticeModal } = await import('@/contexts/popup/components/dialogs/show-notice-modal');

  return { showNoticeModal, dialogMocks: { showModal, close } };
};

const okButton = () => document.getElementById('notice-close') as HTMLButtonElement;

describe('showNoticeModal', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('falls back to dialog_notice as the title when none is given', async () => {
    const { showNoticeModal, dialogMocks } = await loadModule();

    showNoticeModal({ message: 'hello' });

    expect(document.getElementById('notice-title')?.textContent).toBe('dialog_notice');
    expect(document.getElementById('notice-text')?.innerHTML).toBe('hello');
    expect(dialogMocks.showModal).toHaveBeenCalled();
  });

  it('uses the given title instead of dialog_notice', async () => {
    const { showNoticeModal } = await loadModule();

    showNoticeModal({ title: 'Update 1.6.0', message: 'hello' });

    expect(document.getElementById('notice-title')?.textContent).toBe('Update 1.6.0');
  });

  it('converts newlines in the message to <br>', async () => {
    const { showNoticeModal } = await loadModule();

    showNoticeModal({ message: 'line1\nline2' });

    expect(document.getElementById('notice-text')?.innerHTML).toBe('line1<br>line2');
  });

  it('does not run cleanup just by showing the modal', async () => {
    const { showNoticeModal } = await loadModule();
    const cleanup = vi.fn();

    showNoticeModal({ message: 'hello', cleanup });

    expect(cleanup).not.toHaveBeenCalled();
  });

  it('runs cleanup only after the OK button is clicked', async () => {
    const { showNoticeModal, dialogMocks } = await loadModule();
    const cleanup = vi.fn();

    showNoticeModal({ message: 'hello', cleanup });
    okButton().click();

    expect(dialogMocks.close).toHaveBeenCalled();
    expect(cleanup).toHaveBeenCalledTimes(1);
  });

  it('runs only the latest cleanup when shown again before OK is clicked', async () => {
    const { showNoticeModal } = await loadModule();
    const firstCleanup = vi.fn();
    const secondCleanup = vi.fn();

    showNoticeModal({ message: 'first', cleanup: firstCleanup });
    showNoticeModal({ message: 'second', cleanup: secondCleanup });
    okButton().click();

    expect(firstCleanup).not.toHaveBeenCalled();
    expect(secondCleanup).toHaveBeenCalledTimes(1);
  });

  it('clears the message text when the dialog closes', async () => {
    const { showNoticeModal, dialogMocks } = await loadModule();

    showNoticeModal({ message: 'hello' });
    dialogMocks.close();

    expect(document.getElementById('notice-text')?.textContent).toBe('');
  });
});
