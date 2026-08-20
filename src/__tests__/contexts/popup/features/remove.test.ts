import { afterEach, describe, expect, it, vi } from 'vitest';

const { showChoicesModal, sendTaskRequest, getMessage } = vi.hoisted(() => ({
  showChoicesModal: vi.fn(),
  sendTaskRequest: vi.fn(),
  getMessage: vi.fn((key: string) => key),
}));

vi.mock('@/contexts/popup/components/dialogs', () => ({ showChoicesModal }));
vi.mock('@/contexts/popup/features/utils/send-task-request', () => ({ sendTaskRequest }));
vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

const load = async () => {
  vi.resetModules();

  const { sendRemoveRequest } = await import('@/contexts/popup/features/remove');
  const { STATE } = await import('@/contexts/popup/state');

  return { sendRemoveRequest, STATE };
};

describe('sendRemoveRequest', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips the confirm dialog and sends the task directly when noConfirm is on', async () => {
    const { sendRemoveRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, noConfirm: true };

    await sendRemoveRequest();

    expect(showChoicesModal).not.toHaveBeenCalled();
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'remove' });
  });

  it('asks for the all-window message when includeAllWindow is on', async () => {
    const { sendRemoveRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    showChoicesModal.mockResolvedValue('confirm');

    await sendRemoveRequest();

    expect(showChoicesModal).toHaveBeenCalledWith({
      message: 'dialog_remove_allwin',
      commands: ['confirm', 'show_duplicate', 'cancel'],
    });
  });

  it('does nothing when the modal is cancelled', async () => {
    const { sendRemoveRequest } = await load();

    showChoicesModal.mockResolvedValue('cancel');

    await sendRemoveRequest();

    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('sends the task without the duplicate-page flag when confirmed', async () => {
    const { sendRemoveRequest } = await load();

    showChoicesModal.mockResolvedValue('confirm');

    await sendRemoveRequest();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'remove',
      shouldShowDuplicatePage: false,
    });
  });

  it('sends the task with the duplicate-page flag when show_duplicate is chosen', async () => {
    const { sendRemoveRequest } = await load();

    showChoicesModal.mockResolvedValue('show_duplicate');

    await sendRemoveRequest();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'remove',
      shouldShowDuplicatePage: true,
    });
  });
});
