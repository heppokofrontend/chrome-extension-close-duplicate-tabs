import { showConfirmModal } from '@/popup/dialogs';
import { STATE, save } from '@/popup/state';
import { type SaveDataType, getSaveData } from '@/utils';
import { isUpdateBadgeMode, isValidOptionType } from '@/utils/type-guard';
import type { SortType } from '@/worker/features/sort';
import type { TaskRequest } from '@/worker/types';

const getMessage = (key: string) => chrome.i18n.getMessage(key);

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

const showNoticeModal = (() => {
  const noticeModal = document.getElementById('notice') as HTMLDialogElement;
  const noticeModalText = document.getElementById('notice-text') as HTMLParagraphElement;
  const okButton = document.getElementById('notice-close') as HTMLButtonElement;

  noticeModal.ariaLabel = getMessage('dialog_notice');
  noticeModal.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      noticeModal.close();
    }
  });

  okButton.addEventListener('click', () => {
    noticeModal.close();
  });

  return (taskName: string) => {
    const textContent = getMessage(`dialog_${taskName}`);

    noticeModalText.textContent = '';
    noticeModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));
    noticeModal.showModal();
    noticeModal.focus();
  };
})();

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

const onClickEventHandler = async (e: Event) => {
  if (!(e.currentTarget instanceof HTMLButtonElement)) {
    return;
  }
  const postMessage = ({
    taskName,
    shouldShowDuplicatePage = false,
    sortType = 'cancel',
  }: {
    taskName: string;
    shouldShowDuplicatePage?: boolean;
    sortType?: SortType;
  }) => {
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

  const taskName = e.currentTarget.dataset['taskName'];
  const { noConfirm } = STATE.saveData;

  switch (taskName) {
    case 'remove': {
      const messageName = STATE.saveData.includeAllWindow ? 'remove_allwin' : taskName;

      if (noConfirm) {
        postMessage({ taskName });
        return;
      }

      const result = await showConfirmModal<'confirm' | 'show_duplicate' | 'cancel'>(messageName, {
        type: 'remove',
        commands: ['confirm', 'show_duplicate', 'cancel'],
      });

      if (result === 'cancel') {
        return;
      }

      postMessage({ taskName, shouldShowDuplicatePage: result === 'show_duplicate' });
      break;
    }

    case 'reload': {
      const messageName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

      if (!noConfirm && (await showConfirmModal(messageName)) === 'cancel') {
        return;
      }

      postMessage({ taskName });
      break;
    }

    // １つにまとめる
    case 'combine':
      if (!noConfirm) {
        if (
          (!STATE.saveData.includeAllWindow &&
            (await showConfirmModal(`${taskName}_all`)) === 'cancel') ||
          (await showConfirmModal(taskName)) === 'cancel'
        ) {
          return;
        }
      }

      postMessage({ taskName });
      break;

    // 全部別窓にする
    case 'divide':
      if (!noConfirm) {
        if (
          (STATE.saveData.includeAllWindow &&
            (await showConfirmModal(`${taskName}_all`)) === 'cancel') ||
          (await showConfirmModal(taskName)) === 'cancel'
        ) {
          return;
        }
      }

      postMessage({ taskName });
      break;

    case 'sort': {
      const sortType = await showConfirmModal<SortType>(taskName, {
        type: 'multiple',
        commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'cancel'],
      });

      if (sortType === 'cancel') {
        return;
      }

      postMessage({ taskName, sortType });
      break;
    }

    case 'categorize': {
      const minCategorizeNumber = await showConfirmModal<number | 'cancel'>(taskName, {
        type: 'range',
        range: Array.from({ length: 10 }, (_, index) => index),
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
      void onClickEventHandler(e);
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
