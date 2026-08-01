import { UI } from '@/contexts/popup/constants';
import { STATE, save } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

import { RULE_CHECKBOX_FIELDS } from './constants';
import {
  onAddButtonClick,
  onDeleteButtonClick,
  onOriginInput,
  onRuleCheckboxChange,
} from './handlers';
import { headingTextFor } from './utils';

const defaultRule: PathRule = { origin: '', pathname: false, query: false, hash: false };

export const patchRule = (key: string, patch: Partial<PathRule>) => {
  const current = STATE.saveData.advancedPathRules[key] ?? defaultRule;

  save({
    advancedPathRules: {
      ...STATE.saveData.advancedPathRules,
      [key]: { ...current, ...patch },
    },
  });
};

const attachRuleListeners = (fragmentOrSection: DocumentFragment | HTMLElement, key: string) => {
  fragmentOrSection
    .querySelector<HTMLInputElement>('.advanced-path-rules__origin')
    ?.addEventListener('input', onOriginInput(key));

  for (const field of RULE_CHECKBOX_FIELDS) {
    const input = fragmentOrSection.querySelector<HTMLInputElement>(
      `.advanced-path-rules__${field}`,
    );

    if (input) {
      input.addEventListener('change', onRuleCheckboxChange(key, field));
      input.id = `advanced-path-rule-${field}-${key}`;

      const label = input.parentElement?.previousElementSibling;

      if (label instanceof HTMLLabelElement) {
        label.htmlFor = input.id;
      }
    }
  }

  fragmentOrSection
    .querySelector<HTMLButtonElement>('.advanced-path-rules__delete')
    ?.addEventListener('click', onDeleteButtonClick(key));
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

  section.id = `advanced-path-rule-${key}`;
  section.dataset['key'] = key;
  heading.id = `added-${key}`;
  heading.textContent = headingTextFor(rule.origin);
  section.setAttribute('aria-labelledby', heading.id);
  originInput.setAttribute('aria-label', getMessage('aria_advancedPathRuleOrigin'));
  originInput.value = rule.origin;

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

  for (const field of RULE_CHECKBOX_FIELDS) {
    const checkbox = fragment.querySelector<HTMLInputElement>(`.advanced-path-rules__${field}`);
    checkbox?.setAttribute(
      'aria-label',
      getMessage('aria_advancedPathRuleField', [
        rule.origin || getMessage('text_advancedPathRuleUnsetOrigin'),
        field,
      ]),
    );

    if (checkbox) {
      checkbox.checked = rule[field];
    }
  }

  attachRuleListeners(fragment, key);

  return fragment;
};

export const addAdvancedPathRuleListeners = () => {
  UI.advancedPathRuleAddButton.addEventListener('click', onAddButtonClick);
};
