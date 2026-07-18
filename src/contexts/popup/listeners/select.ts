import { setSelectUpdateBadgeModeValue } from '@/contexts/popup/utils/set-select-value';
import { save } from '@/contexts/popup/utils/state';

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
