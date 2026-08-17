import { showChoicesModal } from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** 重複したタブを閉じる */
export const sendRemoveRequest = async () => {
  const taskName = 'remove';
  const messageName = STATE.saveData.includeAllWindow ? 'remove_allwin' : taskName;

  // ここだけ特例で showChoicesModal をスキップする
  if (STATE.saveData.noConfirm) {
    sendTaskRequest({ taskName });
    return;
  }

  const SHOW_DUPLICATE = 'show_duplicate';

  const result = await showChoicesModal({
    message: getMessage(`dialog_${messageName}`),
    commands: ['confirm', SHOW_DUPLICATE, 'cancel'],
  });

  if (result === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName, shouldShowDuplicatePage: result === SHOW_DUPLICATE });
};
