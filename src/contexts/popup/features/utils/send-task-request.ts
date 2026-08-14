import { STATE } from '@/contexts/popup/state';
import type { SortType } from '@/contexts/worker/features/sort';
import type { GatherDestination, GatherScope, TaskRequest } from '@/types';

export type SendTaskRequestParams =
  | {
      taskName: 'remove';
      shouldShowDuplicatePage?: boolean;
    }
  | {
      taskName: 'gather';
      origin: string;
      gatherScope: GatherScope;
      gatherDestination: GatherDestination;
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

      case 'gather':
        return {
          taskName: params.taskName,
          options: {
            saveData: STATE.saveData,
            origin: params.origin,
            gatherScope: params.gatherScope,
            gatherDestination: params.gatherDestination,
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
