import {
  RULE_CHECKBOX_FIELDS,
  type RuleCheckboxField,
} from '@/contexts/popup/components/advanced-path-rules-form/constants';
import {
  onDeleteButtonClick,
  onOriginChange,
  onOriginFocusIn,
  onOriginInput,
  onRuleCheckboxChange,
} from '@/contexts/popup/components/advanced-path-rules-form/handlers';
import { headingTextFor } from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

const attachRuleListeners = (elements: {
  originInput: HTMLInputElement;
  checkboxInputs: Partial<Record<RuleCheckboxField, HTMLInputElement>>;
  deleteButton: HTMLButtonElement;
}) => {
  elements.originInput.addEventListener('focusin', onOriginFocusIn);
  elements.originInput.addEventListener('input', onOriginInput);
  elements.originInput.addEventListener('change', onOriginChange);

  for (const field of RULE_CHECKBOX_FIELDS) {
    elements.checkboxInputs[field]?.addEventListener('change', onRuleCheckboxChange);
  }

  elements.deleteButton.addEventListener('click', onDeleteButtonClick);
};

const getTemplate = () => {
  const fragment = UI.advancedPathRuleTemplate.content.cloneNode(true);

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

  return null;
};

export const buildRuleSection = (key: string, rule: PathRule) => {
  const template = getTemplate();

  if (template === null) {
    return null;
  }

  const { fragment, section, heading, originInput, deleteButton } = template;

  deleteButton.textContent = getMessage('btn_advancedPathRuleDelete');
  deleteButton.dataset['key'] = key;

  section.id = `advanced-path-rule-${key}`;
  section.dataset['key'] = key;
  heading.id = `added-${key}`;
  heading.textContent = headingTextFor(rule.origin);
  section.setAttribute('aria-labelledby', heading.id);
  originInput.setAttribute('aria-label', getMessage('aria_advancedPathRuleOrigin'));
  originInput.value = rule.origin;
  originInput.dataset['key'] = key;

  if (STATE.currentTabOrigin) {
    originInput.placeholder = STATE.currentTabOrigin;
  }

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

  attachRuleListeners({ originInput, checkboxInputs, deleteButton });

  return fragment;
};
