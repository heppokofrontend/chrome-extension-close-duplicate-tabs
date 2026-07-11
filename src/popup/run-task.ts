import { showChoicesModal, showConfirmModal, showRangeModal } from '@/popup/dialogs';
import { STATE } from '@/popup/state';
import type { TaskName, TaskRequest } from '@/types';
import { isValidSortType } from '@/utils/type-guard';
import type { SortType } from '@/worker/features/sort';

type SendTaskRequestParams =
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

const sendTaskRequest = ({
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

/** 重複したタブを閉じる */
const requestRemove = async () => {
  const taskName = 'remove';
  const messageName = STATE.saveData.includeAllWindow ? 'remove_allwin' : taskName;

  // ここだけ特例で showChoicesModal をスキップする
  if (STATE.saveData.noConfirm) {
    sendTaskRequest({ taskName });
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

  sendTaskRequest({ taskName, shouldShowDuplicatePage: result === SHOW_DUPLICATE });
};

/** すべてのタブをリロードする */
const requestReload = async () => {
  const taskName = 'reload';
  const resolvedTaskName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

  if ((await showConfirmModal({ taskName: resolvedTaskName })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};

/** 全ウィンドウを１つにまとめる */
const requestCombine = async () => {
  const taskName = 'combine';
  const shouldWarnAboutAllWindows = !STATE.saveData.includeAllWindow;

  if (shouldWarnAboutAllWindows) {
    if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
      return;
    }
  }

  if ((await showConfirmModal({ taskName })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};

/** すべてのタブを別窓にする */
const requestDivide = async () => {
  const taskName = 'divide';
  const shouldWarnAboutAllWindows = STATE.saveData.includeAllWindow;

  if (shouldWarnAboutAllWindows) {
    if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
      return;
    }
  }

  if ((await showConfirmModal({ taskName })) === 'cancel') {
    return;
  }

  sendTaskRequest({ taskName });
};

/** どのルールでタブを並び替えるか選んでもらう */
const requestSort = async () => {
  const taskName = 'sort';
  const sortType = await showChoicesModal({
    taskName,
    commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'cancel'],
  });

  if (isValidSortType(sortType)) {
    sendTaskRequest({ taskName, sortType });
  }
};

/** ホスト名ごとに別窓にする */
const requestCategorize = async () => {
  const taskName = 'categorize';
  const minCategorizeNumber = await showRangeModal({
    taskName,
    min: 0,
    max: 9,
  });

  if (Number.isNaN(minCategorizeNumber)) {
    return;
  }

  sendTaskRequest({ taskName });
};

export const runTask = (taskName: TaskName) => {
  switch (taskName) {
    case 'remove':
      return requestRemove();
    case 'reload':
      return requestReload();
    case 'combine':
      return requestCombine();
    case 'divide':
      return requestDivide();
    case 'sort':
      return requestSort();
    case 'categorize':
      return requestCategorize();
  }
};
