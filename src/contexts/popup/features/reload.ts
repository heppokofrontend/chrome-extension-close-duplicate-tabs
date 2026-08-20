import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import { getMessage, getTabs } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** この枚数を超えて全ウィンドウを対象にリロードする場合、対象範囲の確認を1段階挟む */
const ALL_WINDOW_WARNING_THRESHOLD = 10;

/** すべてのタブをリロードする */
export const sendReloadRequest = async () => {
  const taskName = 'reload';
  const tabs = await getTabs(STATE.saveData);

  if (STATE.saveData.includeAllWindow) {
    const answer = await showConfirmModal({ message: getMessage('dialog_reload_allwin') });

    if (answer === 'cancel') {
      return;
    }
  }

  if (!STATE.saveData.includeAllWindow || ALL_WINDOW_WARNING_THRESHOLD < tabs.length) {
    const answer = await showConfirmModal({
      message: getMessage('dialog_reload', String(tabs.length)),
    });

    if (answer === 'cancel') {
      return;
    }
  }

  sendTaskRequest({ taskName });
};
