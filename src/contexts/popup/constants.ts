/* eslint-disable @typescript-eslint/no-non-null-assertion, @typescript-eslint/no-unnecessary-type-parameters */
const $ = <T extends Element>(selector: string) => document.querySelector<T>(selector)!;
const $$ = <T extends Element>(selector: string) => document.querySelectorAll<T>(selector);

/** リリースごとに手動で更新する、新機能お知らせバッジの対象バージョン。 */
export const ANNOUNCEMENT_VERSION = 'v1.6.4';

export const POPUP_UI = {
  showUpdateInfoButton: $<HTMLButtonElement>('#show-update-info-button'),
  runButtons: $$<HTMLButtonElement>('button[data-task-name]'),
  optionCheckboxes: $$<HTMLInputElement>('input[type="checkbox"][data-option-type]'),
  optionSelects: $$<HTMLSelectElement>('select[data-option-type]'),
  details: $$<HTMLDetailsElement>('details'),
  advancedPathRulesContainer: $<HTMLElement>('#advanced-path-rules__custom-rules'),
  advancedPathRuleTemplate: $<HTMLTemplateElement>('#advanced-path-rule-template'),
  advancedPathRuleAddButton: $<HTMLButtonElement>('#advanced-path-rules__add'),
  advancedPathRuleDatalist: $<HTMLDataListElement>('#advanced-path-rules__datalist'),

  // confirm dialog interfaces
  confirmModal: $<HTMLDialogElement>('#confirm'),
  confirmModalText: $<HTMLParagraphElement>('#confirm-text'),
  confirmFormContainer: $<HTMLDivElement>('#confirm-controls'),
  confirmDialogButtonContainer: $<HTMLElement>('#confirm-buttons'),
};
