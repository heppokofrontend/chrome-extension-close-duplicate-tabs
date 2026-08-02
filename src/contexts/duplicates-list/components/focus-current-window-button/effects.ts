import { UI } from '@/contexts/duplicates-list/constants';

export const initFocusCurrentWindowButton = async () => {
  const { lastWindowId } = await chrome.storage.session.get('lastWindowId');

  UI.focusCurrentWindowButton.addEventListener('click', () => {
    if (typeof lastWindowId !== 'number') {
      return;
    }

    chrome.windows.update(lastWindowId, { focused: true }, () => {
      if (chrome.runtime.lastError) {
        alert(chrome.i18n.getMessage('duplicates_already_closed'));
      }
    });
  });
};
