import { showChoicesModal, showConfirmModal, showRangeModal } from '@/popup/dialogs';
import { STATE } from '@/popup/state';
import type { TaskName, TaskRequest } from '@/types';
import { isValidSortType } from '@/utils/type-guard';
import type { SortType } from '@/worker/features/sort';

type PostMessageParams =
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

export const runTask = async (taskName: TaskName) => {
  const postMessage = ({
    taskName,
    shouldShowDuplicatePage = false,
    sortType,
  }: PostMessageParams) => {
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

  const { noConfirm } = STATE.saveData;

  switch (taskName) {
    case 'remove': {
      const messageName = STATE.saveData.includeAllWindow ? 'remove_allwin' : taskName;

      if (noConfirm) {
        postMessage({ taskName });
        return;
      }

      const SHOW_DUPLICATE = 'show_duplicate';

      const result = await showChoicesModal({
        taskName: messageName,
        commands: ['confirm', SHOW_DUPLICATE, 'cancel'],
      });

      if (result === 'cancel') {
        return;
      }

      postMessage({ taskName, shouldShowDuplicatePage: result === SHOW_DUPLICATE });
      break;
    }

    case 'reload': {
      const resolvedTaskName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

      if ((await showConfirmModal({ taskName: resolvedTaskName })) === 'cancel') {
        return;
      }

      postMessage({ taskName });
      break;
    }

    // １つにまとめる
    case 'combine': {
      const shouldWarnAboutAllWindows = !STATE.saveData.includeAllWindow;

      if (shouldWarnAboutAllWindows) {
        if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
          return;
        }
      }

      if ((await showConfirmModal({ taskName })) === 'cancel') {
        return;
      }

      postMessage({ taskName });
      break;
    }

    // 全部別窓にする
    case 'divide': {
      const shouldWarnAboutAllWindows = STATE.saveData.includeAllWindow;

      if (shouldWarnAboutAllWindows) {
        if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
          return;
        }
      }

      if ((await showConfirmModal({ taskName })) === 'cancel') {
        return;
      }

      postMessage({ taskName });
      break;
    }

    case 'sort': {
      const sortType = await showChoicesModal({
        taskName,
        commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'cancel'],
      });

      if (isValidSortType(sortType)) {
        postMessage({ taskName, sortType });
        return;
      }

      break;
    }

    case 'categorize': {
      const minCategorizeNumber = await showRangeModal({
        taskName,
        min: 0,
        max: 9,
      });

      if (Number.isNaN(minCategorizeNumber)) {
        return;
      }

      postMessage({ taskName });
      break;
    }
  }
};
