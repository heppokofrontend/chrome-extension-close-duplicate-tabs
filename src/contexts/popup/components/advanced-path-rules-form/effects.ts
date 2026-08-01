import { UI } from '@/contexts/popup/constants';

import { onAddButtonClick } from './handlers';

export const addAdvancedPathRuleListeners = () => {
  UI.advancedPathRuleAddButton.addEventListener('click', onAddButtonClick);
};
