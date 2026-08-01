const $$ = <T extends Element>(selector: string) => document.querySelectorAll<T>(selector);

export const UI = {
  optionCheckboxes: $$<HTMLInputElement>('input[type="checkbox"][data-option-type]'),
  optionSelects: $$<HTMLSelectElement>('select[data-option-type]'),
  details: $$<HTMLDetailsElement>('details'),
};
