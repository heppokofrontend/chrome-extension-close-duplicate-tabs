import { STATE, save } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

import { RULE_CHECKBOX_FIELDS, type RuleCheckboxField } from './constants';
import { buildRuleSection } from './renderers';
import { headingTextFor } from './utils';

const CONTAINER_ID = 'advanced-path-rules__custom-rules';
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

const addRule = (container: HTMLElement, key: string, rule: PathRule) => {
  const fragment = buildRuleSection(key, rule);

  if (!fragment) {
    return;
  }

  attachRuleListeners(fragment, key);
  container.append(fragment);
};

/** storage から読み込んだ advancedPathRules を元に、保存済みルールの UI を復元する。 */
export const renderAdvancedPathRules = () => {
  const container = document.getElementById(CONTAINER_ID);

  if (!container) {
    return;
  }

  for (const [key, rule] of Object.entries(STATE.saveData.advancedPathRules)) {
    addRule(container, key, rule);
  }
};

export const addAdvancedPathRuleListeners = () => {
  const addButton = document.getElementById(ADD_BUTTON_ID);
  const container = document.getElementById(CONTAINER_ID);

  addButton?.addEventListener('click', () => {
    if (!container) {
      return;
    }

    const key = String(performance.now());
    const initialRule: PathRule = {
      origin: '',
      pathname: STATE.saveData.ignorePathname,
      query: STATE.saveData.ignoreQuery,
      hash: STATE.saveData.ignoreHash,
    };

    addRule(container, key, initialRule);
    patchRule(key, initialRule);
  });
};
