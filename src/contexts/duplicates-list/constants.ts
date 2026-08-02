/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* eslint-disable @typescript-eslint/no-unnecessary-type-parameters */
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;

export const UI = {
  focusCurrentWindowButton: $<HTMLButtonElement>('#focus-current-window-button'),
  container: $<HTMLElement>('#container'),
};
