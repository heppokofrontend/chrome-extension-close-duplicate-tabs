import {
  type SaveDataType,
  applySaveDataPatch,
  defaultSaveData,
  getSaveData,
  setSaveData,
} from '@/utils';
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

const STATE = {
  dangerZoneIsOpen: false,
  saveData: defaultSaveData,
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

const showConfirmModal = (() => {
  type Commands<T> = T[];
  type Options<T> =
    | {
        type: 'remove';
        commands: Commands<T>;
      }
    | {
        type: 'multiple';
        commands: Commands<T>;
      }
    | {
        type: 'range';
        range: number[];
      };
  const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
  const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
  const buttonContainer = document.getElementById('dialog-buttons') as HTMLParagraphElement;
  const templateButton = document.createElement('button');
  const defaultCommands = ['true', 'false'];

  templateButton.type = 'button';
  confirmModal.ariaLabel = getMessage('dialog_confirm');

  return <T = 'true' | 'false'>(taskName: string, options?: Options<T>) => {
    const textContent = getMessage(`dialog_${taskName}`);

    confirmModalText.textContent = '';
    confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));

    confirmModal.showModal();
    confirmModal.focus();

    return new Promise<T | 'false'>((resolve) => {
      switch (options?.type) {
        case 'range': {
          // FIXME: Type assertion
          const field = document.createElement('label');
          const min = options.range[0] ?? 0;
          const max = options.range[options.range.length - 1] ?? min;
          // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
          let value = STATE.saveData.minCategorizeNumber ?? min;

          field.className = 'textfield-label-in-dialog';
          field.insertAdjacentHTML(
            'afterbegin',
            `
            ${getMessage(`dialog_command_${taskName}_range1`)}
            <input type="number" min="${String(min)}" max="${String(max)}" value="${String(value)}" />
            ${getMessage(`dialog_command_${taskName}_range2`)}
          `,
          );
          field.querySelector('input')?.addEventListener('change', (e) => {
            if (e.target instanceof HTMLInputElement) {
              const valueAsNumber = e.target.valueAsNumber;
              const clamped = Number.isNaN(valueAsNumber)
                ? value
                : Math.min(max, Math.max(min, valueAsNumber));

              e.target.valueAsNumber = clamped;
              value = clamped;

              save({
                ...STATE.saveData,
                minCategorizeNumber: value,
              });
            }
          });
          buttonContainer.appendChild(field);

          const okButton = templateButton.cloneNode();

          okButton.textContent = getMessage(`dialog_command_apply`);
          okButton.addEventListener('click', () => {
            resolve(value as T);
          });

          buttonContainer.appendChild(okButton);

          const cancelButton = templateButton.cloneNode();

          cancelButton.textContent = getMessage(`dialog_command_false`);
          cancelButton.addEventListener('click', () => {
            resolve('false');
          });

          buttonContainer.appendChild(cancelButton);

          break;
        }

        default: {
          (options?.commands ?? (defaultCommands as Commands<T>)).forEach((command) => {
            const button = templateButton.cloneNode();

            button.textContent = getMessage(`dialog_command_${String(command)}`);
            button.addEventListener('click', () => {
              resolve(command);
            });

            buttonContainer.appendChild(button);
          });

          break;
        }
      }
    }).finally(() => {
      buttonContainer.textContent = '';
      confirmModal.close();
    });
  };
})();

const save = (patch: Partial<SaveDataType>) => {
  STATE.saveData = applySaveDataPatch(STATE.saveData, patch);
  setSaveData(STATE.saveData).catch((error: unknown) => {
    // 失敗すると STATE と storage が食い違ったままになるため、痕跡だけは残す。
    console.error(error);
  });
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

const onClickEventHandler = async (e: Event) => {
  if (!(e.currentTarget instanceof HTMLButtonElement)) {
    return;
  }
  const postMessage = ({
    taskName,
    shouldShowDuplicatePage = false,
    sortType = 'false',
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

      const result = await showConfirmModal<'true' | 'show_duplicate' | 'false'>(messageName, {
        type: 'remove',
        commands: ['true', 'show_duplicate', 'false'],
      });

      if (result === 'false') {
        return;
      }

      postMessage({ taskName, shouldShowDuplicatePage: result === 'show_duplicate' });
      break;
    }

    case 'reload': {
      const messageName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

      if (!noConfirm && (await showConfirmModal(messageName)) === 'false') {
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
            (await showConfirmModal(`${taskName}_all`)) === 'false') ||
          (await showConfirmModal(taskName)) === 'false'
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
            (await showConfirmModal(`${taskName}_all`)) === 'false') ||
          (await showConfirmModal(taskName)) === 'false'
        ) {
          return;
        }
      }

      postMessage({ taskName });
      break;

    case 'sort': {
      const sortType = await showConfirmModal<SortType>(taskName, {
        type: 'multiple',
        commands: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'false'],
      });

      if (sortType === 'false') {
        return;
      }

      postMessage({ taskName, sortType });
      break;
    }

    case 'categorize': {
      const minCategorizeNumber = await showConfirmModal<number | 'false'>(taskName, {
        type: 'range',
        range: Array.from({ length: 10 }, (_, index) => index),
      });

      if (minCategorizeNumber === 'false') {
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
  if (
    e.currentTarget === null ||
    !(e.currentTarget instanceof HTMLInputElement) ||
    e.currentTarget.type !== 'checkbox'
  ) {
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

  const checkboxElements = document.querySelectorAll<HTMLInputElement>('input[data-option-type]');

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
