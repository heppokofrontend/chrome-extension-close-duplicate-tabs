const defaultSaveData = {
  ignorePathname: false,
  ignoreQuery: false,
  ignoreHash: true,
  includeAllWindow: false,
  includePinnedTabs: false,
  noConfirm: false,
};

const STATE = {
  dangerZoneIsOpen: false,
  saveData: defaultSaveData,
};

const getMessage = (key: string) => chrome.i18n.getMessage(key) || key;
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
  const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
  const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
  const buttonContainer = document.getElementById('dialog-buttons') as HTMLParagraphElement;
  const templateButton = document.createElement('button');
  const defaultComannds = ['true', 'false'];

  templateButton.type = 'button';
  confirmModal.ariaLabel = getMessage('dialog_comfirm');

  return <T = 'true' | 'false'>(taskName: string, comannds?: Commands<T>) => {
    const textContent = getMessage(`dialog_${taskName}`);

    confirmModalText.textContent = '';
    confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));

    confirmModal.showModal();
    confirmModal.focus();

    return new Promise<T>((resolve) => {
      (comannds ?? (defaultComannds as Commands<T>)).forEach((command) => {
        const button = templateButton.cloneNode();

        button.textContent = getMessage(`dialog_command_${String(command)}`);
        button.addEventListener('click', () => resolve(command));

        buttonContainer.appendChild(button);
      });
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
      for (const [key, value] of Object.entries<boolean>(saveData ?? defaultSaveData)) {
        const checkbox = document.querySelector<HTMLInputElement>(`[data-option-type=${key}]`);

        if (checkbox) {
          checkbox.checked = value;
        }
      }

      STATE.saveData = saveData ?? defaultSaveData;
    }),
  ]);
};

const addEvent = () => {
  let sortType: SortType = 'false';
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

      case 'combine':
        if (
          !noConfirm &&
          !STATE.saveData.includeAllWindow &&
          (await showConfirmModal(taskName)) === 'false'
        ) {
          return;
        }

        break;

      case 'sort': {
        sortType = await showConfirmModal<SortType>(taskName, [
          'sortByUrl',
          'sortByTitle',
          'sortByHostAndTitle',
          'false',
        ]);

        if (sortType === 'false') {
          return;
        }
      }
    }

    const port = chrome.runtime.connect();

    port.postMessage({
      taskName,
      options: {
        ...STATE.saveData,
        sort: sortType,
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
