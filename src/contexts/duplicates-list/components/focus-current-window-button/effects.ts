import { UI } from '@/contexts/duplicates-list/constants';

import { createOnReturnButtonClick } from './handlers';

export const initFocusCurrentWindowButton = async () => {
  const { lastWindowId } = await chrome.storage.session.get('lastWindowId');

  UI.returnButton.addEventListener(
    'click',
    createOnReturnButtonClick(typeof lastWindowId === 'number' ? lastWindowId : undefined),
  );
};
