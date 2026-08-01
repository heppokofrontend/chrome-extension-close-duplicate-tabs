import { initDetailsElements } from '@/contexts/popup/components/disclosures';
import { initOptionCheckboxes } from '@/contexts/popup/components/option-checkbox';
import { initOptionSelects } from '@/contexts/popup/components/option-select';
import { addAdvancedPathRuleListeners } from '@/contexts/popup/listeners/advanced-path-rules';
import { runTask } from '@/contexts/popup/run-task';
import { isValidTaskName } from '@/utils/type-guard';

export const addListener = () => {
  const buttons = document.querySelectorAll<HTMLButtonElement>('.buttons button');

  for (const button of buttons) {
    button.addEventListener('click', (e) => {
      if (!(e.currentTarget instanceof HTMLButtonElement)) {
        return;
      }

      const taskName = e.currentTarget.dataset['taskName'];

      if (isValidTaskName(taskName)) {
        void runTask(taskName);
      }
    });
  }

  initOptionSelects();
  initOptionCheckboxes();
  addAdvancedPathRuleListeners();
  initDetailsElements();
};
