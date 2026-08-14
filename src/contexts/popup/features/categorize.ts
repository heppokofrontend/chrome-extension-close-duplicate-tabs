import { showRangeModal } from '@/contexts/popup/components/dialogs';

import { sendTaskRequest } from './utils/send-task-request';

/** ホスト名ごとに別窓にする */
export const sendCategorizeRequest = async () => {
  const taskName = 'categorize';
  const minCategorizeNumber = await showRangeModal({
    taskName,
    min: 0,
    max: 9,
  });

  if (Number.isNaN(minCategorizeNumber)) {
    return;
  }

  sendTaskRequest({ taskName });
};
