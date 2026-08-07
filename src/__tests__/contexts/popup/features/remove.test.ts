import { afterEach, describe, expect, it, vi } from 'vitest';

const { showChoicesModal, sendTaskRequest } = vi.hoisted(() => ({
  showChoicesModal: vi.fn(),
  sendTaskRequest: vi.fn(),
}));

vi.mock('@/contexts/popup/components/dialogs', () => ({ showChoicesModal }));
vi.mock('@/contexts/popup/features/utils/send-task-request', () => ({ sendTaskRequest }));

const load = async () => {
  vi.resetModules();

  const { requestRemove } = await import('@/contexts/popup/features/remove');
  const { STATE } = await import('@/contexts/popup/state');

  return { requestRemove, STATE };
};

describe('requestRemove', () => {
  afterEach(() => {
    vi.clearAllMocks();
  });

  it('skips the confirm dialog and sends the task directly when noConfirm is on', async () => {
    const { requestRemove, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, noConfirm: true };

    await requestRemove();

    expect(showChoicesModal).not.toHaveBeenCalled();
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'remove' });
  });

  it('asks for the all-window message when includeAllWindow is on', async () => {
    const { requestRemove, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    showChoicesModal.mockResolvedValue('confirm');

    await requestRemove();

    expect(showChoicesModal).toHaveBeenCalledWith({
      taskName: 'remove_allwin',
      commands: ['confirm', 'show_duplicate', 'cancel'],
    });
  });

  it('does nothing when the modal is cancelled', async () => {
    const { requestRemove } = await load();

    showChoicesModal.mockResolvedValue('cancel');

    await requestRemove();

    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('sends the task without the duplicate-page flag when confirmed', async () => {
    const { requestRemove } = await load();

    showChoicesModal.mockResolvedValue('confirm');

    await requestRemove();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'remove',
      shouldShowDuplicatePage: false,
    });
  });

  it('sends the task with the duplicate-page flag when show_duplicate is chosen', async () => {
    const { requestRemove } = await load();

    showChoicesModal.mockResolvedValue('show_duplicate');

    await requestRemove();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'remove',
      shouldShowDuplicatePage: true,
    });
  });
});
