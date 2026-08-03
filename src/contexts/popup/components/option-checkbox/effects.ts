import { UI } from '@/contexts/popup/constants';

import { onOptionCheckboxChange } from './handlers';

export const initOptionCheckboxes = () => {
  const checkboxElements = UI.optionCheckboxes;

  for (const checkbox of checkboxElements) {
    checkbox.addEventListener('change', onOptionCheckboxChange);
  }
};
