import { UI } from '@/contexts/duplicates-list/constants';
import { getSessionStorage } from '@/utils';

export const initFocusCurrentWindowButton = async () => {
  const lastWindowId = await getSessionStorage('lastWindowId');

  UI.focusCurrentWindowButton.addEventListener('click', () => {
    if (lastWindowId === null) {
      alert(chrome.i18n.getMessage('duplicates_window_not_found'));
      return;
    }

    chrome.windows.update(lastWindowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        alert(chrome.i18n.getMessage('duplicates_already_closed'));
      }
    });
  });
};
