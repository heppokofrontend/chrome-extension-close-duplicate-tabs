import { POPUP_UI } from '@/contexts/popup/constants';

import { onOptionCheckboxChange } from './handlers';

export const initOptionCheckboxes = () => {
  const checkboxElements = POPUP_UI.optionCheckboxes;

  for (const checkbox of checkboxElements) {
    checkbox.addEventListener('change', onOptionCheckboxChange);
  }
};
