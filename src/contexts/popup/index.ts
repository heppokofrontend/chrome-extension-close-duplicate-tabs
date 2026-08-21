import {
  renderAdvancedPathRules,
  addAdvancedPathRuleListeners,
} from '@/contexts/popup/components/advanced-path-rules-form';
import { showNoticeModal } from '@/contexts/popup/components/dialogs';
import { initDetailsElements } from '@/contexts/popup/components/disclosures';
import { initOptionCheckboxes } from '@/contexts/popup/components/option-checkbox';
import { initOptionSelects } from '@/contexts/popup/components/option-select';
import { initRunButtons } from '@/contexts/popup/components/run-buttons';
import { POPUP_UI } from '@/contexts/popup/constants';
import { STATE, save } from '@/contexts/popup/state';
import { setSelectUpdateBadgeModeValue } from '@/contexts/popup/utils/set-select-value';
import { getLocalStorage, getMessage } from '@/utils';

const loadSaveData = async () => {
  return Promise.all([
    getLocalStorage('disclosureOpenStatus').then((disclosureOpenStatus) => {
      Object.assign(STATE.disclosureOpenStatus, disclosureOpenStatus);
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

/** 新機能のお知らせモーダルのスイッチにお知らせバッジを表示する。 */
const initAnnounceNewFeature = () => {
  const key = 'update-announcement';
  const version = 'v1.6.3';
  const value = STATE.saveData.shown[key];

  POPUP_UI.showUpdateInfoButton.addEventListener('click', () => {
    showNoticeModal({
      title: getMessage('announcement_new_feature_title', version.replace(/^v/, '')),
      message: getMessage('announcement_new_feature_message'),
      cleanup: () => {
        save({ shown: { [key]: version } });
        POPUP_UI.showUpdateInfoButton.dataset['checked'] = 'true';
      },
    });
  });

  // すでに表示したユーザ
  if (value === version) {
    return;
  }

  // 一度もお知らせ等を記録したことがない新規インストールユーザにはバッジを表示せず現在のバージョンだけ記録しておく
  if (Object.keys(STATE.saveData.shown).length === 0) {
    save({ shown: { [key]: version } });
    return;
  }

  POPUP_UI.showUpdateInfoButton.dataset['checked'] = 'false';
};

const addListener = () => {
  initRunButtons();
  initOptionSelects();
  initOptionCheckboxes();
  addAdvancedPathRuleListeners();
  initDetailsElements();
  initAnnounceNewFeature();
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
