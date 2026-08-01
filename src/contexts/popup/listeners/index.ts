import { initButtons } from '@/contexts/popup/components/buttons';
import { initDetailsElements } from '@/contexts/popup/components/disclosures';
import { initOptionCheckboxes } from '@/contexts/popup/components/option-checkbox';
import { initOptionSelects } from '@/contexts/popup/components/option-select';
import { addAdvancedPathRuleListeners } from '@/contexts/popup/listeners/advanced-path-rules';

export const addListener = () => {
  initButtons();
  initOptionSelects();
  initOptionCheckboxes();
  addAdvancedPathRuleListeners();
  initDetailsElements();
};
