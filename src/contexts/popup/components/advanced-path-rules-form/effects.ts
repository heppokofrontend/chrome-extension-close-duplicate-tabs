import { UI } from '@/contexts/popup/constants';
import { STATE, save } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

import { RULE_CHECKBOX_FIELDS, type RuleCheckboxField } from './constants';
import { headingTextFor } from './utils';

const ADD_BUTTON_ID = 'advanced-path-rules__add';

const defaultRule: PathRule = { origin: '', pathname: false, query: false, hash: false };

const patchRule = (key: string, patch: Partial<PathRule>) => {
  const current = STATE.saveData.advancedPathRules[key] ?? defaultRule;

  save({
    advancedPathRules: {
      ...STATE.saveData.advancedPathRules,
      [key]: { ...current, ...patch },
    },
  });
};

const onOriginInput = (key: string) => (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const section = e.currentTarget.closest('.advanced-path-rule');
  const heading = section?.querySelector('h3');
  const origin = e.currentTarget.value;

  if (heading) {
    heading.textContent = headingTextFor(origin);
  }

  for (const field of RULE_CHECKBOX_FIELDS) {
    section
      ?.querySelector(`.advanced-path-rules__${field}`)
      ?.setAttribute(
        'aria-label',
        getMessage('aria_advancedPathRuleField', [
          origin || getMessage('text_advancedPathRuleUnsetOrigin'),
          field,
        ]),
      );
  }

  patchRule(key, { origin });
};

const onRuleCheckboxChange = (key: string, field: RuleCheckboxField) => (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  patchRule(key, { [field]: e.currentTarget.checked });
};

const deleteRule = (key: string) => {
  save({
    advancedPathRules: Object.fromEntries(
      Object.entries(STATE.saveData.advancedPathRules).filter(([k]) => k !== key),
    ),
  });
};

const onDeleteClick = (key: string) => (e: Event) => {
  if (!(e.currentTarget instanceof HTMLElement)) {
    return;
  }

  e.currentTarget.closest('.advanced-path-rule')?.remove();
  deleteRule(key);
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
    ?.addEventListener('click', onDeleteClick(key));
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
  const addButton = document.getElementById(ADD_BUTTON_ID);

  addButton?.addEventListener('click', () => {
    const key = String(performance.now());
    const initialRule: PathRule = {
      origin: '',
      pathname: STATE.saveData.ignorePathname,
      query: STATE.saveData.ignoreQuery,
      hash: STATE.saveData.ignoreHash,
    };

    const fragment = buildRuleSection(key, initialRule);

    if (fragment) {
      UI.advancedPathRulesContainer.append(fragment);
    }

    patchRule(key, initialRule);
  });
};
