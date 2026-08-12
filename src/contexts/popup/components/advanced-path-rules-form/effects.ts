import { POPUP_UI } from '@/contexts/popup/constants';

import { onAddButtonClick } from './handlers';

export const addAdvancedPathRuleListeners = () => {
  POPUP_UI.advancedPathRuleAddButton.addEventListener('click', onAddButtonClick);
};
