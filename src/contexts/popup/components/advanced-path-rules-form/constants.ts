export const RULE_CHECKBOX_FIELDS = ['pathname', 'query', 'hash'] as const;
export type RuleCheckboxField = (typeof RULE_CHECKBOX_FIELDS)[number];
