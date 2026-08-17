import { afterEach, describe, expect, it, vi } from 'vitest';

const { showChoicesModal, showSelectModal, showNoticeModal, sendTaskRequest } = vi.hoisted(() => ({
  showChoicesModal: vi.fn(),
  showSelectModal: vi.fn(),
  showNoticeModal: vi.fn(),
  sendTaskRequest: vi.fn(),
}));

vi.mock('@/contexts/popup/components/dialogs', () => ({
  showChoicesModal,
  showSelectModal,
  showNoticeModal,
}));
vi.mock('@/contexts/popup/features/utils/send-task-request', () => ({ sendTaskRequest }));

const load = async () => {
  vi.resetModules();

  const { sendGatherRequest } = await import('@/contexts/popup/features/gather');
  const { STATE } = await import('@/contexts/popup/state');

  return { sendGatherRequest, STATE };
};

const stubTabs = (
  tabs: Array<{ url?: string | undefined; pinned?: boolean; groupId?: number }>,
) => {
  const query = vi.fn((arg: { pinned?: boolean }) =>
    Promise.resolve(arg.pinned === false ? tabs.filter((tab) => !tab.pinned) : tabs),
  );

  vi.stubGlobal('chrome', {
    tabs: { query },
    tabGroups: { TAB_GROUP_ID_NONE: -1 },
    i18n: { getMessage: vi.fn((key: string) => key) },
  });

  return { query };
};

describe('sendGatherRequest', () => {
  afterEach(() => {
    vi.clearAllMocks();
    vi.unstubAllGlobals();
  });

  it('asks for the target scope when includeAllWindow is off, and stops on cancel', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    showChoicesModal.mockResolvedValue('cancel');
    stubTabs([]);

    await sendGatherRequest();

    expect(showChoicesModal).toHaveBeenCalledWith({
      message: 'dialog_gather_all',
      commands: ['gatherFromCurrentWindow', 'gatherFromAllWindows', 'cancel'],
    });
    expect(showSelectModal).not.toHaveBeenCalled();
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('skips the scope choice when includeAllWindow is on', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    showSelectModal.mockResolvedValue('cancel');
    stubTabs([]);

    await sendGatherRequest();

    expect(showChoicesModal).not.toHaveBeenCalled();
  });

  it('queries only the current window when gatherFromCurrentWindow is chosen', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    showChoicesModal.mockResolvedValue('gatherFromCurrentWindow');
    showSelectModal.mockResolvedValue('cancel');
    const { query } = stubTabs([{ url: 'https://a.example.com/x' }]);

    await sendGatherRequest();

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: false,
    });
  });

  it('queries all windows when gatherFromAllWindows is chosen', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    showChoicesModal.mockResolvedValue('gatherFromAllWindows');
    showSelectModal.mockResolvedValue('cancel');
    const { query } = stubTabs([{ url: 'https://a.example.com/x' }]);

    await sendGatherRequest();

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: undefined,
      pinned: false,
    });
  });

  it('excludes origins that only have pinned tabs when includePinnedTabs is off', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true, includePinnedTabs: false };
    stubTabs([
      { url: 'https://pinned-only.example.com/x', pinned: true },
      { url: 'https://a.example.com/y' },
    ]);

    await sendGatherRequest();

    expect(showSelectModal).toHaveBeenCalledWith({
      message: 'dialog_gather',
      fields: [
        {
          key: 'origin',
          label: 'dialog_command_gather_select_origin',
          options: [{ value: 'https://a.example.com', label: 'https://a.example.com' }],
        },
        {
          key: 'destination',
          label: 'dialog_command_gather_select_destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'currentWindowGroup', label: 'dialog_command_currentWindowGroup' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
  });

  it('includes origins from pinned tabs when includePinnedTabs is on', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true, includePinnedTabs: true };
    const { query } = stubTabs([{ url: 'https://pinned-only.example.com/x', pinned: true }]);

    await sendGatherRequest();

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: undefined,
      pinned: undefined,
    });
    expect(showSelectModal).toHaveBeenCalledWith({
      message: 'dialog_gather',
      fields: [
        {
          key: 'origin',
          label: 'dialog_command_gather_select_origin',
          options: [
            { value: 'https://pinned-only.example.com', label: 'https://pinned-only.example.com' },
          ],
        },
        {
          key: 'destination',
          label: 'dialog_command_gather_select_destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'currentWindowGroup', label: 'dialog_command_currentWindowGroup' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
  });

  it('excludes origins that only have grouped tabs when includeGroupedTabs is off', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true, includeGroupedTabs: false };
    stubTabs([
      { url: 'https://grouped-only.example.com/x', groupId: 1 },
      { url: 'https://a.example.com/y', groupId: -1 },
    ]);

    await sendGatherRequest();

    expect(showSelectModal).toHaveBeenCalledWith({
      message: 'dialog_gather',
      fields: [
        {
          key: 'origin',
          label: 'dialog_command_gather_select_origin',
          options: [{ value: 'https://a.example.com', label: 'https://a.example.com' }],
        },
        {
          key: 'destination',
          label: 'dialog_command_gather_select_destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'currentWindowGroup', label: 'dialog_command_currentWindowGroup' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
  });

  it('includes origins from grouped tabs when includeGroupedTabs is on', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true, includeGroupedTabs: true };
    stubTabs([{ url: 'https://grouped-only.example.com/x', groupId: 1 }]);

    await sendGatherRequest();

    expect(showSelectModal).toHaveBeenCalledWith({
      message: 'dialog_gather',
      fields: [
        {
          key: 'origin',
          label: 'dialog_command_gather_select_origin',
          options: [
            {
              value: 'https://grouped-only.example.com',
              label: 'https://grouped-only.example.com',
            },
          ],
        },
        {
          key: 'destination',
          label: 'dialog_command_gather_select_destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'currentWindowGroup', label: 'dialog_command_currentWindowGroup' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
  });

  it('does nothing when there are no open origins', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    stubTabs([{ url: undefined }, { url: 'not a url' }]);

    await sendGatherRequest();

    expect(showNoticeModal).toHaveBeenCalledWith({ message: 'dialog_gather_empty' });
    expect(showSelectModal).not.toHaveBeenCalled();
    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('dedupes origins and sorts them alphabetically regardless of tab order or current tab', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    STATE.currentTabOrigin = 'https://zzz.example.com/page';
    showSelectModal.mockResolvedValue('cancel');
    stubTabs([
      { url: 'https://b.example.com/x' },
      { url: 'https://a.example.com/y' },
      { url: 'https://a.example.com/z' },
    ]);

    await sendGatherRequest();

    expect(showSelectModal).toHaveBeenCalledWith({
      message: 'dialog_gather',
      fields: [
        {
          key: 'origin',
          label: 'dialog_command_gather_select_origin',
          options: [
            { value: 'https://a.example.com', label: 'https://a.example.com' },
            { value: 'https://b.example.com', label: 'https://b.example.com' },
          ],
        },
        {
          key: 'destination',
          label: 'dialog_command_gather_select_destination',
          options: [
            { value: 'currentWindow', label: 'dialog_command_currentWindow' },
            { value: 'currentWindowGroup', label: 'dialog_command_currentWindowGroup' },
            { value: 'newWindow', label: 'dialog_command_newWindow' },
          ],
        },
      ],
    });
  });

  it('does nothing when the host-picker modal is cancelled', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    showSelectModal.mockResolvedValue('cancel');
    stubTabs([{ url: 'https://a.example.com/x' }]);

    await sendGatherRequest();

    expect(sendTaskRequest).not.toHaveBeenCalled();
  });

  it('sends the task with the chosen scope, origin, and destination', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: true };
    showSelectModal.mockResolvedValue({
      origin: 'https://a.example.com',
      destination: 'newWindow',
    });
    stubTabs([{ url: 'https://a.example.com/x' }]);

    await sendGatherRequest();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'gather',
      origin: 'https://a.example.com',
      gatherScope: 'allWindows',
      gatherDestination: 'newWindow',
    });
  });

  it('sends the task with gatherScope "currentWindow" when that scope was chosen', async () => {
    const { sendGatherRequest, STATE } = await load();

    STATE.saveData = { ...STATE.saveData, includeAllWindow: false };
    showChoicesModal.mockResolvedValue('gatherFromCurrentWindow');
    showSelectModal.mockResolvedValue({
      origin: 'https://a.example.com',
      destination: 'currentWindow',
    });
    stubTabs([{ url: 'https://a.example.com/x' }]);

    await sendGatherRequest();

    expect(sendTaskRequest).toHaveBeenCalledWith({
      taskName: 'gather',
      origin: 'https://a.example.com',
      gatherScope: 'currentWindow',
      gatherDestination: 'currentWindow',
    });
  });
});
