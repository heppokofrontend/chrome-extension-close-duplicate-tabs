import { showCategorizeModal } from '@/contexts/popup/components/dialogs';

import { sendTaskRequest } from './utils/send-task-request';

/** ホスト名ごとに別窓にする */
export const sendCategorizeRequest = async () => {
  const taskName = 'categorize';
  const minCategorizeNumber = await showCategorizeModal({ taskName });

  if (Number.isNaN(minCategorizeNumber)) {
    return;
  }

  sendTaskRequest({ taskName });
};
