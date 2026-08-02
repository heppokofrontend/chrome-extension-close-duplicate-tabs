import {
  renderAdvancedPathRules,
  addAdvancedPathRuleListeners,
} from '@/contexts/popup/components/advanced-path-rules-form';
import { initDetailsElements } from '@/contexts/popup/components/disclosures';
import { initOptionCheckboxes } from '@/contexts/popup/components/option-checkbox';
import { initOptionSelects } from '@/contexts/popup/components/option-select';
import { initRunButtons } from '@/contexts/popup/components/run-buttons';
import { STATE } from '@/contexts/popup/state';
import { setSelectUpdateBadgeModeValue } from '@/contexts/popup/utils/set-select-value';
import { getLocalStorage } from '@/utils';

const loadSaveData = async () => {
  return Promise.all([
    getLocalStorage('dialogOpenStatus').then((dialogOpenStatus) => {
      Object.assign(STATE.dialogOpenStatus, dialogOpenStatus);
    }),
    getLocalStorage('saveData').then((saveData) => {
      for (const [key, value] of Object.entries(saveData)) {
        const controls = document.querySelectorAll<HTMLElement>(`[data-option-type=${key}]`);

        for (const control of controls) {
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
      }

      STATE.saveData = saveData;
    }),
  ]);
};

const loadCurrentTabOrigin = async () => {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  try {
    STATE.currentTabOrigin = currentTab?.url ? new URL(currentTab.url).origin : null;
  } catch {
    STATE.currentTabOrigin = null;
  }
};

const addListener = () => {
  initRunButtons();
  initOptionSelects();
  initOptionCheckboxes();
  addAdvancedPathRuleListeners();
  initDetailsElements();
};

const init = async () => {
  await Promise.all([loadSaveData(), loadCurrentTabOrigin()]);
  renderAdvancedPathRules();
  addListener();

  // CSS Transitionの有効化
  setTimeout(() => {
    document.body.dataset['transition'] = 'ready';
  }, 300);
};

void init();
