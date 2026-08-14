import {
  RULE_CHECKBOX_FIELDS,
  type RuleCheckboxField,
} from '@/contexts/popup/components/advanced-path-rules-form/constants';
import {
  onAllowedQueryParamsInput,
  onDeleteButtonClick,
  onOriginChange,
  onOriginFocusIn,
  onOriginInput,
  onRuleCheckboxChange,
} from '@/contexts/popup/components/advanced-path-rules-form/handlers';
import { headingTextFor } from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { POPUP_UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

const attachRuleListeners = (elements: {
  originInput: HTMLInputElement;
  checkboxInputs: Partial<Record<RuleCheckboxField, HTMLInputElement>>;
  allowedQueryParamsInput: HTMLInputElement | null;
  deleteButton: HTMLButtonElement;
}) => {
  elements.originInput.addEventListener('focusin', onOriginFocusIn);
  elements.originInput.addEventListener('input', onOriginInput);
  elements.originInput.addEventListener('change', onOriginChange);

  for (const field of RULE_CHECKBOX_FIELDS) {
    elements.checkboxInputs[field]?.addEventListener('change', onRuleCheckboxChange);
  }

  elements.allowedQueryParamsInput?.addEventListener('input', onAllowedQueryParamsInput);
  elements.deleteButton.addEventListener('click', onDeleteButtonClick);
};

type RuleTemplate = {
  fragment: DocumentFragment;
  section: HTMLElement;
  heading: HTMLElement;
  originInput: HTMLInputElement;
  deleteButton: HTMLButtonElement;
};

const getTemplate = (): RuleTemplate => {
  const fragment = POPUP_UI.advancedPathRuleTemplate.content.cloneNode(true);

  if (fragment instanceof DocumentFragment) {
    const section = fragment.querySelector('.advanced-path-rule');
    const heading = fragment.querySelector('h3');
    const originInput = fragment.querySelector('.advanced-path-rules__origin');
    const deleteButton = fragment.querySelector('.advanced-path-rules__delete-button');

    if (
      section instanceof HTMLElement &&
      heading instanceof HTMLElement &&
      originInput instanceof HTMLInputElement &&
      deleteButton instanceof HTMLButtonElement
    ) {
      return {
        fragment,
        section,
        heading,
        originInput,
        deleteButton,
      };
    }
  }

  throw new TypeError('Failed to find required elements in the advanced path rule template.');
};

type RuleSetupArgs = {
  key: string;
  rule: PathRule;
  template: RuleTemplate;
};

const setupSectionMeta = ({ key, rule, template }: RuleSetupArgs) => {
  const { section, heading } = template;

  section.id = `advanced-path-rule-${key}`;
  section.dataset['key'] = key;
  heading.id = `added-${key}`;
  heading.textContent = headingTextFor(rule.origin);
  section.setAttribute('aria-labelledby', heading.id);
};

const setupOriginInput = ({ key, rule, template }: RuleSetupArgs) => {
  const { originInput } = template;

  originInput.setAttribute('aria-label', getMessage('aria_advancedPathRuleOrigin'));
  originInput.value = rule.origin;
  originInput.dataset['key'] = key;

  if (STATE.currentTabOrigin) {
    originInput.placeholder = STATE.currentTabOrigin;
  }
};

const setupDeleteButton = ({ key, template }: Omit<RuleSetupArgs, 'rule'>) => {
  const { deleteButton } = template;

  deleteButton.textContent = getMessage('btn_advancedPathRuleDelete');
  deleteButton.dataset['key'] = key;
};

const setupCheckboxes = ({ key, rule, template }: RuleSetupArgs) => {
  const { fragment } = template;
  const checkboxInputs: Partial<Record<RuleCheckboxField, HTMLInputElement>> = {};

  for (const field of RULE_CHECKBOX_FIELDS) {
    const checkbox = fragment.querySelector<HTMLInputElement>(`.advanced-path-rules__${field}`);

    if (!checkbox) {
      continue;
    }

    checkbox.setAttribute(
      'aria-label',
      getMessage('aria_advancedPathRuleField', [
        rule.origin || getMessage('text_advancedPathRuleUnsetOrigin'),
        field,
      ]),
    );
    checkbox.checked = rule[field];
    checkbox.id = `advanced-path-rule-${field}-${key}`;
    checkbox.dataset['key'] = key;
    checkbox.dataset['field'] = field;

    const label = checkbox.parentElement?.previousElementSibling;

    if (label instanceof HTMLLabelElement) {
      label.htmlFor = checkbox.id;
    }

    checkboxInputs[field] = checkbox;
  }

  return checkboxInputs;
};

const setupAllowedQueryParams = ({ key, rule, template }: RuleSetupArgs) => {
  const { fragment } = template;
  const allowedQueryParamsItem = fragment.querySelector(
    '.advanced-path-rules__allowed-query-params-item',
  );
  const allowedQueryParamsInput = fragment.querySelector(
    '.advanced-path-rules__allowed-query-params',
  );

  if (
    !(allowedQueryParamsItem instanceof HTMLElement) ||
    !(allowedQueryParamsInput instanceof HTMLInputElement)
  ) {
    throw new TypeError('Failed to find allowedQueryParams elements in the template.');
  }

  allowedQueryParamsInput.id = `advanced-path-rule-allowedQueryParams-${key}`;
  allowedQueryParamsInput.dataset['key'] = key;
  allowedQueryParamsInput.value = rule.allowedQueryParams ?? '';

  const label = allowedQueryParamsItem.querySelector('label');

  if (label instanceof HTMLLabelElement) {
    label.htmlFor = allowedQueryParamsInput.id;
    label.textContent = getMessage('label_advancedPathRuleAllowedQueryParams');
  }

  return allowedQueryParamsInput;
};

export const buildRuleSection = (key: string, rule: PathRule) => {
  const template = getTemplate();

  setupSectionMeta({ key, rule, template });
  setupOriginInput({ key, rule, template });
  setupDeleteButton({ key, template });

  const checkboxInputs = setupCheckboxes({ key, rule, template });
  const allowedQueryParamsInput = setupAllowedQueryParams({ key, rule, template });

  attachRuleListeners({
    originInput: template.originInput,
    checkboxInputs,
    allowedQueryParamsInput,
    deleteButton: template.deleteButton,
  });

  return template.fragment;
};
