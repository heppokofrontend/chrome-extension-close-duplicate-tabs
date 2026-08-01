import { UI } from '@/contexts/popup/constants';

import { onRunButtonClick } from './handlers';

export const initRunButtons = () => {
  const buttonElements = UI.runButtons;

  for (const button of buttonElements) {
    button.addEventListener('click', onRunButtonClick);
  }
};
