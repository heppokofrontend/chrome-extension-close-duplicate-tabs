import { createInputHistoryPatch } from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { save } from '@/contexts/popup/state';

export const onOriginChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const patch = createInputHistoryPatch({
    key: 'advancedPathRuleOrigin',
    value: e.currentTarget.value,
  });

  if (patch) {
    save({ inputHistory: patch });
  }
};
