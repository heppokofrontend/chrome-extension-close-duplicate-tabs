import { afterEach, describe, expect, it, vi } from 'vitest';

const { showConfirmModal, sendTaskRequest } = vi.hoisted(() => ({
  showConfirmModal: vi.fn(),
  sendTaskRequest: vi.fn(),
}));

vi.mock('@/contexts/popup/components/dialogs', () => ({ showConfirmModal }));
vi.mock('@/contexts/popup/features/utils/send-task-request', () => ({ sendTaskRequest }));

const load = async () => {
  vi.resetModules();

  const { sendReloadRequest } = await import('@/contexts/popup/features/reload');
  const { STATE } = await import('@/contexts/popup/state');

  return { sendReloadRequest, STATE };
};

const stubTabs = (count: number) => {
  const query = vi.fn(() => Promise.resolve(Array.from({ length: count }, () => ({}))));

  vi.stubGlobal('chrome', {
    tabs: { query },
    i18n: {
      getMessage: vi.fn((key: string, substitutions?: string | string[]) =>
        substitutions === undefined ? key : `${key}:${[substitutions].flat().join(',')}`,
      ),
    },
  });

  return { query };
};

describe('sendReloadRequest', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('asks once when not targeting all windows, and stops on cancel', async () => {
    const { sendReloadRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    stubTabs(3);
    showConfirmModal.mockResolvedValue('cancel');

    await sendReloadRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(1);
    expect(showConfirmModal).toHaveBeenCalledWith({ message: 'dialog_reload:3' });
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('asks once and reloads when not targeting all windows', async () => {
    const { sendReloadRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    stubTabs(3);
    showConfirmModal.mockResolvedValue('confirm');

    await sendReloadRequest();

    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'reload' });
  });

  it('asks once when targeting all windows but the tab count is at or below the threshold', async () => {
    const { sendReloadRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubTabs(10);
    showConfirmModal.mockResolvedValue('confirm');

    await sendReloadRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(1);
    expect(showConfirmModal).toHaveBeenCalledWith({ message: 'dialog_reload_allwin' });
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'reload' });
  });

  it('warns first when targeting all windows above the threshold, and stops if the warning is cancelled', async () => {
    const { sendReloadRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubTabs(11);
    showConfirmModal.mockResolvedValueOnce('cancel');

    await sendReloadRequest();

    expect(showConfirmModal).toHaveBeenCalledTimes(1);
    expect(showConfirmModal).toHaveBeenCalledWith({ message: 'dialog_reload_allwin' });
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('asks a second time with the tab count after the all-window warning is confirmed', async () => {
    const { sendReloadRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubTabs(11);
    showConfirmModal.mockResolvedValueOnce('confirm').mockResolvedValueOnce('confirm');

    await sendReloadRequest();

    expect(showConfirmModal).toHaveBeenNthCalledWith(1, { message: 'dialog_reload_allwin' });
    expect(showConfirmModal).toHaveBeenNthCalledWith(2, { message: 'dialog_reload:11' });
    expect(sendTaskRequest).toHaveBeenCalledWith({ taskName: 'reload' });
  });
});
