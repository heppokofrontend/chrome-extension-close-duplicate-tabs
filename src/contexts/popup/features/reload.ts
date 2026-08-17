import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** すべてのタブをリロードする */
export const sendReloadRequest = async () => {
  const taskName = 'reload';
  const resolvedTaskName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

  if (
    (await showConfirmModal({ message: getMessage(`dialog_${resolvedTaskName}`) })) === 'cancel'
  ) {
    return;
  }

  sendTaskRequest({ taskName });
};
