import { UI } from '@/contexts/popup/constants';

import { onButtonClick } from './handlers';

export const initButtons = () => {
  const buttonElements = UI.buttons;

  for (const button of buttonElements) {
    button.addEventListener('click', onButtonClick);
  }
};
