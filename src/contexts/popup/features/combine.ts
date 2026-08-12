import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';

import { sendTaskRequest } from './utils/send-task-request';

/** 全ウィンドウを１つにまとめる */
export const sendCombineRequest = async () => {
  const taskName = 'combine';
  const shouldWarnAboutAllWindows = !STATE.saveData.includeAllWindow;

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
