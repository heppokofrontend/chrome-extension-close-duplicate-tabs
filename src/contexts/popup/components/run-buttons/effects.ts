import { POPUP_UI } from '@/contexts/popup/constants';

import { onRunButtonClick } from './handlers';

export const initRunButtons = () => {
  const buttonElements = POPUP_UI.runButtons;

  for (const button of buttonElements) {
    button.addEventListener('click', onRunButtonClick);
  }
};
