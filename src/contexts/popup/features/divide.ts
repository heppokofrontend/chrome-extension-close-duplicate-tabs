import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';

import { sendTaskRequest } from './utils/send-task-request';

/** すべてのタブを別窓にする */
export const sendDivideRequest = async () => {
  const taskName = 'divide';
  const shouldWarnAboutAllWindows = STATE.saveData.includeAllWindow;

  if (shouldWarnAboutAllWindows) {
    if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
      return;
    }
  }

  if ((await showConfirmModal({ taskName })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};
