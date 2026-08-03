import { UI } from '@/contexts/popup/constants';

import { onOptionSelectChange } from './handlers';

export const initOptionSelects = () => {
  const selectElements = UI.optionSelects;

  for (const select of selectElements) {
    select.addEventListener('change', onOptionSelectChange);
  }
};
