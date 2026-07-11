import {
  showChoicesModal,
  showConfirmModal,
  showNoticeModal,
  showRangeConfirmModal,
} from '@/popup/dialogs';
import { STATE, save } from '@/popup/state';
import type { TaskName, TaskRequest } from '@/types';
import { type SaveDataType, getMessage, getSaveData } from '@/utils';
import {
  isUpdateBadgeMode,
  isValidOptionType,
  isValidSortType,
  isValidTaskName,
} from '@/utils/type-guard';
import type { SortType } from '@/worker/features/sort';

const setSelectValue = ({
  select,
  optionType,
  value,
}: {
  select: HTMLSelectElement;
  optionType: string;
  value: string;
}) => {
  // ストレージ由来の value は不正な可能性があるため、実際の <option> と照合し、
  // 一致しなければ先頭の option（安全なデフォルト）にフォールバックする。
  const validValues = Array.from(select.options, (option) => option.value);
  const safeValue = validValues.includes(value) ? value : (select.options[0]?.value ?? value);
  const valueElement = select.parentElement?.querySelector('.value');

  select.value = safeValue;
  select.dataset['value'] = safeValue;

  if (valueElement instanceof HTMLElement) {
    valueElement.textContent = getMessage(`select_visible_value_${optionType}_${safeValue}`);
  }
};

const loadSaveData = async () => {
  return Promise.all([
    new Promise<void>((resolve) => {
      chrome.storage.local.get('dangerZoneIsOpen', ({ dangerZoneIsOpen }) => {
        STATE.dangerZoneIsOpen = typeof dangerZoneIsOpen === 'boolean' ? dangerZoneIsOpen : false;
        resolve();
      });
    }),
    getSaveData().then((saveData) => {
      for (const [key, value] of Object.entries(saveData)) {
        const control = document.querySelector<HTMLElement>(`[data-option-type=${key}]`);

        if (control instanceof HTMLInputElement && typeof value === 'boolean') {
          control.checked = value;
        }

        if (control instanceof HTMLSelectElement && typeof value === 'string') {
          setSelectValue({
            select: control,
            optionType: key,
            value,
          });
        }
      }

      STATE.saveData = saveData;
    }),
  ]);
};

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

const runTask = async (taskName: TaskName) => {
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

      if (!noConfirm) {
        if ((await showConfirmModal({ taskName: resolvedTaskName })) === 'cancel') {
          return;
        }
      }

      postMessage({ taskName });
      break;
    }

    // １つにまとめる
    case 'combine': {
      if (!noConfirm) {
        const shouldWarnAboutAllWindows = !STATE.saveData.includeAllWindow;

        if (shouldWarnAboutAllWindows) {
          if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
            return;
          }
        }

        if ((await showConfirmModal({ taskName })) === 'cancel') {
          return;
        }
      }

      postMessage({ taskName });
      break;
    }

    // 全部別窓にする
    case 'divide': {
      if (!noConfirm) {
        const shouldWarnAboutAllWindows = STATE.saveData.includeAllWindow;

        if (shouldWarnAboutAllWindows) {
          if ((await showConfirmModal({ taskName: `${taskName}_all` })) === 'cancel') {
            return;
          }
        }

        if ((await showConfirmModal({ taskName })) === 'cancel') {
          return;
        }
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
      const minCategorizeNumber = await showRangeConfirmModal({
        taskName,
        min: 0,
        max: 9,
      });

      if (minCategorizeNumber === 'cancel') {
        return;
      }

      postMessage({ taskName });
      break;
    }
  }
};

const onSelectChange = (e: Event) => {
  if (e.currentTarget === null || !(e.currentTarget instanceof HTMLSelectElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;
  const { value } = e.currentTarget;

  if (optionType === undefined) {
    return;
  }

  setSelectValue({
    select: e.currentTarget,
    optionType,
    value,
  });

  if (optionType === 'updateBadgeMode' && isUpdateBadgeMode(value)) {
    save({ updateBadgeMode: value });
  }
};

const onCheckboxChange = (e: Event) => {
  if (e.currentTarget === null || !(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;

  if (!isValidOptionType(optionType)) {
    return;
  }

  const patch: Partial<SaveDataType> = { [optionType]: e.currentTarget.checked };

  if (e.currentTarget.checked && !STATE.saveData.noConfirm) {
    switch (optionType) {
      case 'ignorePathname':
      case 'noConfirm':
        showNoticeModal(optionType);
        break;

      case 'autoAvoidDuplicate': {
        if (!STATE.saveData.shown[optionType]) {
          showNoticeModal(optionType);
          patch.shown = { [optionType]: new Date().toISOString() };
        }
        break;
      }
    }
  }

  save(patch);
};

const addEvent = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.buttons button');

  for (const button of buttons) {
    button.addEventListener('click', (e) => {
      if (!(e.currentTarget instanceof HTMLButtonElement)) {
        return;
      }

      const taskName = e.currentTarget.dataset['taskName'];

      if (isValidTaskName(taskName)) {
        void runTask(taskName);
      }
    });
  }

  const selectElements = document.querySelectorAll<HTMLSelectElement>('select[data-option-type]');

  for (const select of selectElements) {
    select.addEventListener('change', onSelectChange);
  }

  const checkboxElements = document.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"][data-option-type]',
  );

  for (const checkbox of checkboxElements) {
    checkbox.addEventListener('change', onCheckboxChange);
  }

  const dangerDetails = document.querySelector<HTMLDetailsElement>('#dangerDetails');
  const dangerDetailsSummary = dangerDetails?.querySelector('summary');

  dangerDetailsSummary?.addEventListener('click', () => {
    void chrome.storage.local.set({ dangerZoneIsOpen: !dangerDetails?.open });
  });

  if (dangerDetails) {
    dangerDetails.open = STATE.dangerZoneIsOpen;
  }
};

const init = async () => {
  await loadSaveData();
  addEvent();
};

void init();

// CSS Transitionの有効化
setTimeout(() => {
  document.body.dataset['state'] = 'loaded';
}, 300);
