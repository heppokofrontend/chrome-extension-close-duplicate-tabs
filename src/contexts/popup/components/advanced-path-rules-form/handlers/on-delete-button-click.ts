import { STATE, save } from '@/contexts/popup/state';

export const onDeleteButtonClick = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLElement)) {
    return;
  }

  const key = e.currentTarget.dataset['key'] ?? '';

  if (key === '') {
    return;
  }

  e.currentTarget.closest('.advanced-path-rule')?.remove();

  save({
    advancedPathRules: Object.fromEntries(
      Object.entries(STATE.saveData.advancedPathRules).filter(([k]) => k !== key),
    ),
  });
};
