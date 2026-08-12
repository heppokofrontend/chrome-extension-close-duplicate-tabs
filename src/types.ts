import type { SortType } from '@/contexts/worker/features/sort';
import type { SaveDataType } from '@/utils';

export const taskNames = ['remove', 'reload', 'combine', 'divide', 'sort', 'categorize'] as const;
export type TaskName = (typeof taskNames)[number];

export type TabWithId = chrome.tabs.Tab & {
  id: number;
};

export type TabWithIdAndUrl = chrome.tabs.Tab & {
  id: number;
  url: string;
};

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
