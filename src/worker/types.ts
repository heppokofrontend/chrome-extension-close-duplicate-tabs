import type { SaveDataType } from '@/utils';
import type { SortType } from '@/worker/sort';

export type ValidTab = chrome.tabs.Tab & {
  id: number;
};

/** popup から service worker へ postMessage される、タスク実行リクエストの形状 */
export type TaskRequest = {
  taskName?: string | undefined;
  options?:
    | {
        saveData?: SaveDataType | undefined;
        sort?: SortType | undefined;
        shouldShowDuplicatePage?: boolean | undefined;
      }
    | undefined;
};
