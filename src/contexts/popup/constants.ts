/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-parameters */
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector);
const $$ = <T extends Element>(selector: string) => document.querySelectorAll<T>(selector);

export const UI = {
  runButtons: $$<HTMLButtonElement>('button[data-task-name]'),
  optionCheckboxes: $$<HTMLInputElement>('input[type="checkbox"][data-option-type]'),
  optionSelects: $$<HTMLSelectElement>('select[data-option-type]'),
  details: $$<HTMLDetailsElement>('details'),
  advancedPathRulesContainer: $<HTMLElement>('#advanced-path-rules__custom-rules')!,
  advancedPathRuleTemplate: $<HTMLTemplateElement>('#advanced-path-rule-template')!,
};
