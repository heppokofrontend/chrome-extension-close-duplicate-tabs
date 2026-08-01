import { addAdvancedPathRuleListeners } from '@/contexts/popup/components/advanced-path-rules-form';
import { initDetailsElements } from '@/contexts/popup/components/disclosures';
import { initOptionCheckboxes } from '@/contexts/popup/components/option-checkbox';
import { initOptionSelects } from '@/contexts/popup/components/option-select';
import { initRunButtons } from '@/contexts/popup/components/run-buttons';

export const addListener = () => {
  initRunButtons();
  initOptionSelects();
  initOptionCheckboxes();
  addAdvancedPathRuleListeners();
  initDetailsElements();
};
