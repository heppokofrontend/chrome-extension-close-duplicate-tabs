import { type RuleCheckboxField } from '@/contexts/popup/components/advanced-path-rules-form/constants';
import { patchRule } from '@/contexts/popup/components/advanced-path-rules-form/effects';

export const onRuleCheckboxChange = (key: string, field: RuleCheckboxField) => (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  patchRule(key, { [field]: e.currentTarget.checked });
};
