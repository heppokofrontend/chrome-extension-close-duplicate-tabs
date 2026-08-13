import type { TASK_NAMES } from '@/constants';
import type { SortType } from '@/contexts/worker/features/sort';
import type { SaveDataType } from '@/utils';

export type TabWithId = chrome.tabs.Tab & {
  id: number;
};

export type TabWithIdAndUrl = chrome.tabs.Tab & {
  id: number;
  url: string;
};

export type TaskName = (typeof TASK_NAMES)[number];

/** popup から service worker へ postMessage される、タスク実行リクエストの形状 */
export type TaskRequest =
  | {
      taskName: 'remove';
      options: {
        saveData: SaveDataType;
        shouldShowDuplicatePage: boolean;
      };
    }
  | {
      taskName: 'sort';
      options: {
        saveData: SaveDataType;
        sort: SortType | undefined;
      };
    }
  | {
      taskName: 'reload' | 'combine' | 'divide' | 'categorize';
      options: {
        saveData: SaveDataType;
      };
    };
