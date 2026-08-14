import { LIST_UI } from '@/contexts/duplicates-list/constants';
import { getSessionStorage } from '@/utils';

const errorMessage = chrome.i18n.getMessage('duplicates_window_not_found');

export const initFocusCurrentWindowButton = async () => {
  const lastWindowId = await getSessionStorage('lastWindowId');

  LIST_UI.focusCurrentWindowButton.addEventListener('click', () => {
    if (lastWindowId === null) {
      alert(errorMessage);
      return;
    }

    chrome.windows.update(lastWindowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        alert(errorMessage);
      }
    });
  });
};
