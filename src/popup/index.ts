import { addListener, setSelectValue } from '@/popup/listeners';
import { STATE } from '@/popup/state';
import { getSaveData } from '@/utils';

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

const init = async () => {
  await loadSaveData();
  addListener();
};

void init();

// CSS Transitionの有効化
setTimeout(() => {
  document.body.dataset['state'] = 'loaded';
}, 300);
