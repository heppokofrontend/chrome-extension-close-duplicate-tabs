import { STATE } from '@/contexts/popup/state';
import type { SortType } from '@/contexts/worker/features/sort';
import type { TaskRequest } from '@/types';

export type SendTaskRequestParams =
  | {
      taskName: 'remove';
      shouldShowDuplicatePage?: boolean;
    }
  | {
      taskName: 'sort';
      sortType?: SortType;
    }
  | {
      taskName: 'reload' | 'combine' | 'divide' | 'categorize';
    };

export const sendTaskRequest = (params: SendTaskRequestParams) => {
  const port = chrome.runtime.connect();

  const message: TaskRequest = (() => {
    switch (params.taskName) {
      case 'remove':
        return {
          taskName: params.taskName,
          options: {
            saveData: STATE.saveData,
            shouldShowDuplicatePage: params.shouldShowDuplicatePage ?? false,
          },
        };

      case 'sort':
        return {
          taskName: params.taskName,
          options: {
            saveData: STATE.saveData,
            sort: params.sortType,
          },
        };

      default:
        return {
          taskName: params.taskName,
          options: {
            saveData: STATE.saveData,
          },
        };
    }
  })();

  port.postMessage(message);
};
