import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** すべてのタブを別窓にする */
export const sendDivideRequest = async () => {
  const taskName = 'divide';
  const shouldWarnAboutAllWindows = STATE.saveData.includeAllWindow;

  if ((await showConfirmModal({ message: getMessage(`dialog_${taskName}`) })) === 'cancel') {
    return;
  }

  if (shouldWarnAboutAllWindows) {
    if ((await showConfirmModal({ message: getMessage(`dialog_${taskName}_all`) })) === 'cancel') {
      return;
    }
  }

  sendTaskRequest({ taskName });
};
