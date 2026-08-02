import {
  RULE_CHECKBOX_FIELDS,
  type RuleCheckboxField,
} from '@/contexts/popup/components/advanced-path-rules-form/constants';

export const isRuleCheckboxField = (value: unknown): value is RuleCheckboxField =>
  typeof value === 'string' && (RULE_CHECKBOX_FIELDS as readonly string[]).includes(value);
