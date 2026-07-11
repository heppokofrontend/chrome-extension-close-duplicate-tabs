import { showNoticeModal } from '@/popup/dialogs';
import { runTask } from '@/popup/run-task';
import { STATE, save } from '@/popup/state';
import { type SaveDataType, getMessage } from '@/utils';
import { isUpdateBadgeMode, isValidOptionType, isValidTaskName } from '@/utils/type-guard';

export const setSelectValue = ({
  select,
  optionType,
  value,
}: {
  select: HTMLSelectElement;
  optionType: string;
  value: string;
}) => {
  // ストレージ由来の value は不正な可能性があるため、実際の <option> と照合し、
  // 一致しなければ先頭の option（安全なデフォルト）にフォールバックする。
  const validValues = Array.from(select.options, (option) => option.value);
  const safeValue = validValues.includes(value) ? value : (select.options[0]?.value ?? value);
  const valueElement = select.parentElement?.querySelector('.value');

  select.value = safeValue;
  select.dataset['value'] = safeValue;

  if (valueElement instanceof HTMLElement) {
    valueElement.textContent = getMessage(`select_visible_value_${optionType}_${safeValue}`);
  }
};

const onSelectChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLSelectElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;
  const { value } = e.currentTarget;

  if (optionType === undefined) {
    return;
  }

  setSelectValue({
    select: e.currentTarget,
    optionType,
    value,
  });

  if (optionType === 'updateBadgeMode' && isUpdateBadgeMode(value)) {
    save({ updateBadgeMode: value });
  }
};

const onCheckboxChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;

  if (!isValidOptionType(optionType)) {
    return;
  }

  const patch: Partial<SaveDataType> = { [optionType]: e.currentTarget.checked };

  if (e.currentTarget.checked && !STATE.saveData.noConfirm) {
    switch (optionType) {
      case 'ignorePathname':
      case 'noConfirm':
        showNoticeModal(optionType);
        break;

      case 'autoAvoidDuplicate': {
        if (!STATE.saveData.shown[optionType]) {
          showNoticeModal(optionType);
          patch.shown = { [optionType]: new Date().toISOString() };
        }
        break;
      }
    }
  }

  save(patch);
};

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

  const dangerDetails = document.querySelector<HTMLDetailsElement>('#dangerDetails');
  const dangerDetailsSummary = dangerDetails?.querySelector('summary');

  dangerDetailsSummary?.addEventListener('click', () => {
    void chrome.storage.local.set({ dangerZoneIsOpen: !dangerDetails?.open });
  });

  if (dangerDetails) {
    dangerDetails.open = STATE.dangerZoneIsOpen;
  }
};
