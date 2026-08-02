import { showConfirmModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';

import { sendTaskRequest } from './utils/send-task-request';

/** すべてのタブをリロードする */
export const requestReload = async () => {
  const taskName = 'reload';
  const resolvedTaskName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

  if ((await showConfirmModal({ taskName: resolvedTaskName })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};
