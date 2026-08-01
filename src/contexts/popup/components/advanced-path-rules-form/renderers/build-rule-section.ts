import {
  RULE_CHECKBOX_FIELDS,
  type RuleCheckboxField,
} from '@/contexts/popup/components/advanced-path-rules-form/constants';
import {
  onDeleteButtonClick,
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
  elements.originInput.addEventListener('input', onOriginInput);

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
    const datalist = fragment.querySelector('datalist');
    const deleteButton = fragment.querySelector('.advanced-path-rules__delete');

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
        datalist,
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

  const { fragment, section, heading, originInput, datalist, deleteButton } = template;

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

  if (datalist) {
    datalist.id = `advanced-path-rule-origin-datalist-${key}`;
    originInput.setAttribute('list', datalist.id);
  }

  if (STATE.currentTabOrigin) {
    originInput.placeholder = STATE.currentTabOrigin;

    if (datalist) {
      const option = document.createElement('option');
      option.value = STATE.currentTabOrigin;
      datalist.append(option);
    }
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
