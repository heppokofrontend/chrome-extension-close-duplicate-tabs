import { defaultSaveData, getMessage } from '@/utils';
import { isUpdateBadgeMode } from '@/utils/type-guard';

/** 検証済みの値を <select> と表示用テキストへ反映する汎用処理。値の検証は呼び出し側の責務。 */
const setSelectValue = ({
  select,
  optionType,
  safeValue,
}: {
  select: HTMLSelectElement;
  optionType: string;
  safeValue: string;
}) => {
  const valueElement = select.parentElement?.querySelector('.value');

  select.value = safeValue;
  select.dataset['value'] = safeValue;

  if (valueElement instanceof HTMLElement) {
    valueElement.textContent = getMessage(`select_visible_value_${optionType}_${safeValue}`);
  }
};

export const setSelectUpdateBadgeModeValue = ({
  select,
  value,
}: {
  select: HTMLSelectElement;
  value: unknown;
}) => {
  // ストレージ由来の value は不正な可能性があるため、型ガードで検証し、
  // 一致しなければデフォルト値（安全なフォールバック）を使う。
  const safeValue = isUpdateBadgeMode(value) ? value : defaultSaveData.updateBadgeMode;

  setSelectValue({
    select,
    optionType: 'updateBadgeMode',
    safeValue,
  });

  return safeValue;
};
