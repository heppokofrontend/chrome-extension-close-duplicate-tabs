import { addAdvancedPathRuleListeners } from '@/popup/listeners/advanced-path-rules';
import { onCheckboxChange } from '@/popup/listeners/checkbox';
import { onSelectChange } from '@/popup/listeners/select';
import { runTask } from '@/popup/run-task';
import { STATE } from '@/popup/utils/state';
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

  const selectElements = document.querySelectorAll<HTMLSelectElement>('select[data-option-type]');

  for (const select of selectElements) {
    select.addEventListener('change', onSelectChange);
  }

  const checkboxElements = document.querySelectorAll<HTMLInputElement>(
    'input[type="checkbox"][data-option-type]',
  );

  for (const checkbox of checkboxElements) {
    checkbox.addEventListener('change', onCheckboxChange);
  }

  addAdvancedPathRuleListeners();

  const dangerDetails = document.querySelector<HTMLDetailsElement>('#dangerDetails');
  const dangerDetailsSummary = dangerDetails?.querySelector('summary');

  dangerDetailsSummary?.addEventListener('click', () => {
    void chrome.storage.local.set({ dangerZoneIsOpen: !dangerDetails?.open });
  });

  if (dangerDetails) {
    dangerDetails.open = STATE.dangerZoneIsOpen;
  }
};
