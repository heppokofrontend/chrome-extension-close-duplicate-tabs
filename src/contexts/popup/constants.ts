const $$ = <T extends Element>(selector: string) => document.querySelectorAll<T>(selector);

export const UI = {
  buttons: $$<HTMLButtonElement>('.buttons button'),
  optionCheckboxes: $$<HTMLInputElement>('input[type="checkbox"][data-option-type]'),
  optionSelects: $$<HTMLSelectElement>('select[data-option-type]'),
  details: $$<HTMLDetailsElement>('details'),
};
