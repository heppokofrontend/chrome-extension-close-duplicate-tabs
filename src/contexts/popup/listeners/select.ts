import { save } from '@/contexts/popup/state';
import { setSelectUpdateBadgeModeValue } from '@/contexts/popup/utils/set-select-value';

export const onSelectChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLSelectElement)) {
    return;
  }

  const { optionType } = e.currentTarget.dataset;

  if (optionType === 'updateBadgeMode') {
    const updateBadgeMode = setSelectUpdateBadgeModeValue({
      select: e.currentTarget,
      value: e.currentTarget.value,
    });

    save({ updateBadgeMode });
  }
};
