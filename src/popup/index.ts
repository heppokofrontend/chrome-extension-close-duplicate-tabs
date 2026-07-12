import { addListener } from '@/popup/listeners';
import { setSelectUpdateBadgeModeValue } from '@/popup/utils/set-select-value';
import { STATE } from '@/popup/utils/state';
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

        if (control instanceof HTMLSelectElement && key === 'updateBadgeMode') {
          setSelectUpdateBadgeModeValue({
            select: control,
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
  document.body.dataset['transition'] = 'ready';
}, 300);
