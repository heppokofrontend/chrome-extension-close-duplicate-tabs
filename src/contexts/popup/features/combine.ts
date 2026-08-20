import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** 全ウィンドウを１つにまとめる */
export const sendCombineRequest = async () => {
  const taskName = 'combine';
  const shouldWarnAboutAllWindows = !STATE.saveData.includeAllWindow;

  if (shouldWarnAboutAllWindows) {
    if ((await showConfirmModal({ message: getMessage(`dialog_${taskName}_all`) })) === 'cancel') {
      return;
    }
  }

  if ((await showConfirmModal({ message: getMessage(`dialog_${taskName}`) })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};
