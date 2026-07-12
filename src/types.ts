import type { SaveDataType } from '@/utils';
import type { SortType } from '@/worker/features/sort';

export const taskNames = ['remove', 'reload', 'combine', 'divide', 'sort', 'categorize'] as const;
export type TaskName = (typeof taskNames)[number];

/** popup から service worker へ postMessage される、タスク実行リクエストの形状 */
export type TaskRequest = {
  taskName?: TaskName | undefined;
  options?:
    | {
        saveData?: SaveDataType | undefined;
        sort?: SortType | undefined;
        shouldShowDuplicatePage?: boolean | undefined;
      }
    | undefined;
};
