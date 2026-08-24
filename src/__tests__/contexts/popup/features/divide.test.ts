import { afterEach, describe, expect, it, vi } from 'vitest';

const { showConfirmModal, sendTaskRequest } = vi.hoisted(() => ({
  showConfirmModal: vi.fn(),
  sendTaskRequest: vi.fn(),
}));

vi.mock('@/contexts/popup/components/dialogs', () => ({ showConfirmModal }));
vi.mock('@/contexts/popup/features/utils/send-task-request', () => ({ sendTaskRequest }));

const load = async () => {
  vi.resetModules();

  const { sendDivideRequest } = await import('@/contexts/popup/features/divide');
  const { STATE } = await import('@/contexts/popup/state');

  return { sendDivideRequest, STATE };
};

const stubI18n = () => {
  vi.stubGlobal('chrome', { i18n: { getMessage: vi.fn((key: string) => key) } });
};

describe('sendDivideRequest', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('asks the base confirmation first, and stops on cancel without asking the all-windows warning', async () => {
    const { sendDivideRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubI18n();
    showConfirmModal.mockResolvedValueOnce('cancel');

    await sendDivideRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(1);
    expect(showConfirmModal).toHaveBeenCalledWith({ message: 'dialog_divide' });
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('asks the all-windows warning after the base confirmation when targeting all windows', async () => {
    const { sendDivideRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubI18n();
    showConfirmModal.mockResolvedValueOnce('confirm').mockResolvedValueOnce('confirm');

    await sendDivideRequest();

    expect(showConfirmModal).toHaveBeenNthCalledWith(1, { message: 'dialog_divide' });
    expect(showConfirmModal).toHaveBeenNthCalledWith(2, { message: 'dialog_divide_all' });
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'divide' });
  });

  it('stops without sending the request when the all-windows warning is cancelled', async () => {
    const { sendDivideRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubI18n();
    showConfirmModal.mockResolvedValueOnce('confirm').mockResolvedValueOnce('cancel');

    await sendDivideRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(2);
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('asks only the base confirmation when not targeting all windows', async () => {
    const { sendDivideRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    stubI18n();
    showConfirmModal.mockResolvedValueOnce('confirm');

    await sendDivideRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(1);
    expect(showConfirmModal).toHaveBeenCalledWith({ message: 'dialog_divide' });
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'divide' });
  });
});
