import { showChoicesModal } from '@/contexts/popup/components/dialogs';
import { isValidSortType } from '@/contexts/popup/utils/type-guard';
import { getMessage } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

/** どのルールでタブを並び替えるか選んでもらう */
export const sendSortRequest = async () => {
  const taskName = 'sort';
  const sortType = await showChoicesModal({
    message: getMessage(`dialog_${taskName}`),
    commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'sortByLastAccessed', 'cancel'],
  });

  if (isValidSortType(sortType)) {
    sendTaskRequest({ taskName, sortType });
  }
};
