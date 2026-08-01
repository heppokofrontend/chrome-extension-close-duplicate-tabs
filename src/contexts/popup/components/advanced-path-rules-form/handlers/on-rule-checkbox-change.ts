import {
  isRuleCheckboxField,
  patchRule,
} from '@/contexts/popup/components/advanced-path-rules-form/utils';

export const onRuleCheckboxChange = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const { key, field } = e.currentTarget.dataset;

  if (key === undefined || key === '' || !isRuleCheckboxField(field)) {
    return;
  }

  patchRule(key, { [field]: e.currentTarget.checked });
};
