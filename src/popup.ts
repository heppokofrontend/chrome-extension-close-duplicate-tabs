const defaultSaveData = {
  ignorePathname: false,
  ignoreQuery: false,
  ignoreHash: true,
  includeAllWindow: false,
  includePinnedTabs: false,
  noConfirm: false,
  minCategorizeNumber: 1,
};

const STATE = {
  dangerZoneIsOpen: false,
  saveData: defaultSaveData,
};

const getMessage = (key: string) => chrome.i18n.getMessage(key);
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
        type: 'multiple';
        comannds: Commands<T>;
      }
    | {
        type: 'range';
        range: number[];
      };
  const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
  const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
  const buttonContainer = document.getElementById('dialog-buttons') as HTMLParagraphElement;
  const templateButton = document.createElement('button');
  const defaultComannds = ['true', 'false'];

  templateButton.type = 'button';
  confirmModal.ariaLabel = getMessage('dialog_comfirm');

  return <T = 'true' | 'false'>(taskName: string, options?: Options<T>) => {
    const textContent = getMessage(`dialog_${taskName}`);

    confirmModalText.textContent = '';
    confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));

    confirmModal.showModal();
    confirmModal.focus();

    return new Promise<T | 'false'>((resolve) => {
      if (options?.type === 'range') {
        // FIXME: Type assertion
        const field = document.createElement('label');
        const min = options.range[0];
        const max = options.range[options.range.length - 1];
        // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
        let value = STATE.saveData.minCategorizeNumber ?? min;

        field.className = 'textfield-label-in-dialog';
        field.insertAdjacentHTML(
          'afterbegin',
          `
            ${getMessage(`dialog_command_${taskName}_range1`)}
            <input type="number" min="${min}" max="${max}" value="${value}" />
            ${getMessage(`dialog_command_${taskName}_range2`)}
          `,
        );
        field.querySelector('input')?.addEventListener('change', (e) => {
          if (e.target instanceof HTMLInputElement) {
            value = e.target.valueAsNumber;

            save({
              ...STATE.saveData,
              minCategorizeNumber: value,
            });
          }
        });
        buttonContainer.appendChild(field);

        const okButton = templateButton.cloneNode();

        okButton.textContent = getMessage(`dialog_command_apply`);
        okButton.addEventListener('click', () => resolve(value as T));

        buttonContainer.appendChild(okButton);

        const cancelButton = templateButton.cloneNode();

        cancelButton.textContent = getMessage(`dialog_command_false`);
        cancelButton.addEventListener('click', () => resolve('false'));

        buttonContainer.appendChild(cancelButton);
      } else {
        (options?.comannds ?? (defaultComannds as Commands<T>)).forEach((command) => {
          const button = templateButton.cloneNode();

          button.textContent = getMessage(`dialog_command_${String(command)}`);
          button.addEventListener('click', () => resolve(command));

          buttonContainer.appendChild(button);
        });
      }
    }).finally(() => {
      buttonContainer.textContent = '';
      confirmModal.close();
    });
  };
})();

const save = (newSaveData: SaveDataType) => {
  const value = {
    ...STATE.saveData,
    ...newSaveData,
  };

  STATE.saveData = value;

  chrome.storage.local.set({
    saveData: value,
  });
};

const setLanguage = () => {
  const targets = document.querySelectorAll<HTMLElement>('[data-i18n]');

  for (const elm of targets) {
    const { i18n } = elm.dataset;

    if (!i18n) {
      continue;
    }

    const textContent = getMessage(i18n);

    elm.textContent = textContent;
  }
};

const loadSaveData = async () => {
  const getValue = <T>(key: string, callback: (items: Record<string, T | undefined>) => void) =>
    new Promise<void>((resolve) => {
      chrome.storage.local.get(key, (items) => {
        callback(items);
        resolve();
      });
    });

  return Promise.all([
    getValue<boolean>('dangerZoneIsOpen', ({ dangerZoneIsOpen }) => {
      STATE.dangerZoneIsOpen = dangerZoneIsOpen ?? false;
    }),
    getValue<typeof defaultSaveData>('saveData', ({ saveData }) => {
      for (const [key, value] of Object.entries<boolean | number>(saveData ?? defaultSaveData)) {
        const checkbox = document.querySelector<HTMLInputElement>(`[data-option-type=${key}]`);

        if (checkbox && typeof value === 'boolean') {
          checkbox.checked = value;
        }
      }

      STATE.saveData = saveData ?? defaultSaveData;
    }),
  ]);
};

const addEvent = () => {
  let sortType: SortType = 'false';
  let minCategorizeNumber: number | 'false' = 1;
  const buttons = document.querySelectorAll<HTMLButtonElement>('.buttons button');
  const onclickListener = async (e: Event) => {
    if (!(e.currentTarget instanceof HTMLButtonElement)) {
      return;
    }

    const taskName = e.currentTarget.dataset.taskName;
    const { noConfirm } = STATE.saveData;

    switch (taskName) {
      case 'remove': {
        const messageName = STATE.saveData.includeAllWindow ? 'remove_allwin' : taskName;

        if (!noConfirm && (await showConfirmModal(messageName)) === 'false') {
          return;
        }

        break;
      }

      case 'reload': {
        const messageName = STATE.saveData.includeAllWindow ? 'reload_allwin' : taskName;

        if (!noConfirm && (await showConfirmModal(messageName)) === 'false') {
          return;
        }

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

        break;

      case 'sort': {
        sortType = await showConfirmModal<SortType>(taskName, {
          type: 'multiple',
          comannds: ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle', 'false'],
        });

        if (sortType === 'false') {
          return;
        }

        break;
      }

      case 'categorize': {
        minCategorizeNumber = await showConfirmModal<typeof minCategorizeNumber>(taskName, {
          type: 'range',
          range: [...(new Array(10) as [])].map((_, index) => index),
        });

        if (minCategorizeNumber === 'false') {
          return;
        }

        break;
      }
    }

    const port = chrome.runtime.connect();

    port.postMessage({
      taskName,
      options: {
        ...STATE.saveData,
        sort: sortType,
        minCategorizeNumber,
      },
    });
  };

  for (const button of buttons) {
    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    button.addEventListener('click', onclickListener);
  }

  const isValidOptionType = (value: unknown): value is keyof SaveDataType => {
    if (typeof value !== 'string') {
      return false;
    }

    return value in defaultSaveData;
  };

  const onchangeListener = (e: Event) => {
    if (!(e.target instanceof HTMLInputElement)) {
      return;
    }

    const { optionType } = e.target.dataset;

    if (isValidOptionType(optionType)) {
      if (e.target.checked && !STATE.saveData.noConfirm) {
        switch (optionType) {
          case 'ignorePathname':
          case 'noConfirm':
            showNoticeModal(optionType);
        }
      }

      save({
        [optionType]: e.target.checked,
      });
    }
  };
  const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-option-type]');

  for (const checkbox of checkboxes) {
    checkbox.addEventListener('change', onchangeListener);
  }

  const dangerDetails = document.querySelector<HTMLDetailsElement>('#dangerDetails');
  const dangerDetailsSummary = dangerDetails?.querySelector('summary');

  dangerDetailsSummary?.addEventListener('click', () => {
    chrome.storage.local.set({ dangerZoneIsOpen: !dangerDetails?.open });
  });

  if (dangerDetails) {
    dangerDetails.open = STATE.dangerZoneIsOpen;
  }
};

const init = async () => {
  setLanguage();
  await loadSaveData();
  addEvent();
};

init();

// CSS Transitionの有効化
setTimeout(() => {
  document.body.dataset.state = 'loaded';
}, 300);
