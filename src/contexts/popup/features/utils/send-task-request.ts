import { STATE } from '@/contexts/popup/state';
import type { SortType } from '@/contexts/worker/features/sort';
import type { TaskRequest } from '@/types';

export type SendTaskRequestParams =
  | {
      taskName: 'remove';
      shouldShowDuplicatePage?: boolean;
      sortType?: never;
    }
  | {
      taskName: 'sort';
      shouldShowDuplicatePage?: never;
      sortType?: SortType;
    }
  | {
      taskName: 'reload' | 'combine' | 'divide' | 'categorize';
      shouldShowDuplicatePage?: never;
      sortType?: never;
    };

export const sendTaskRequest = ({
  taskName,
  shouldShowDuplicatePage = false,
  sortType,
}: SendTaskRequestParams) => {
  const port = chrome.runtime.connect();
  const message: TaskRequest = {
    taskName,
    options: {
      saveData: STATE.saveData,
      shouldShowDuplicatePage,
      sort: sortType,
    },
  };

  port.postMessage(message);
};
