import { showNoticeModal } from '@/popup/dialogs';
import { STATE, save } from '@/popup/utils/state';
import { type SaveDataType } from '@/utils';
import { isValidOptionType } from '@/utils/type-guard';

export const onCheckboxChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;

  if (!isValidOptionType(optionType)) {
    return;
  }

  const { checked } = e.currentTarget;

  // 同じ optionType を複数箇所（例: advanced-path-rules 内の Default 欄）で
  // 表示している場合、片方の操作で他方が古い値のまま取り残されるのを防ぐ。
  for (const control of document.querySelectorAll<HTMLInputElement>(
    `input[type="checkbox"][data-option-type="${optionType}"]`,
  )) {
    control.checked = checked;
  }

  const patch: Partial<SaveDataType> = { [optionType]: checked };

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
