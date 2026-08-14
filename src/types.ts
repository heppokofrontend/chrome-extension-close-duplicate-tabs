import type { GATHER_DESTINATIONS, TASK_NAMES } from '@/constants';
import type { SortType } from '@/contexts/worker/features/sort';
import type { SaveDataType } from '@/utils';

/** 「特定のホスト名のタブを集める」の対象範囲（このウィンドウのみ／全ウィンドウ）。 */
export type GatherScope = 'currentWindow' | 'allWindows';

export type GatherDestination = (typeof GATHER_DESTINATIONS)[number];

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
      taskName: 'gather';
      options: {
        saveData: SaveDataType;
        origin: string;
        gatherScope: GatherScope;
        gatherDestination: GatherDestination;
      };
    }
  | {
      taskName: 'reload' | 'combine' | 'divide' | 'categorize';
      options: {
        saveData: SaveDataType;
      };
    };
