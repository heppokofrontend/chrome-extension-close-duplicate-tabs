import { showChoicesModal } from '@/contexts/popup/components/dialogs';
import { isValidSortType } from '@/utils/type-guard';

import { sendTaskRequest } from './utils/send-task-request';

/** どのルールでタブを並び替えるか選んでもらう */
export const requestSort = async () => {
  const taskName = 'sort';
  const sortType = await showChoicesModal({
    taskName,
    commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'cancel'],
  });

  if (isValidSortType(sortType)) {
    sendTaskRequest({ taskName, sortType });
  }
};
