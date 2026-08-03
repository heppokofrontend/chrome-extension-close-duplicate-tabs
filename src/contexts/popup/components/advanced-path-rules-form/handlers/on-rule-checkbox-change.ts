import {
  isRuleCheckboxField,
  patchRule,
} from '@/contexts/popup/components/advanced-path-rules-form/utils';

export const onRuleCheckboxChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const key = e.currentTarget.dataset['key'] ?? '';
  const field = e.currentTarget.dataset['field'];

  if (key === '' || !isRuleCheckboxField(field)) {
    return;
  }

  patchRule(key, { [field]: e.currentTarget.checked });
};
