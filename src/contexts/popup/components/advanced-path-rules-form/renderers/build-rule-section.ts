import { RULE_CHECKBOX_FIELDS } from '@/contexts/popup/components/advanced-path-rules-form/constants';
import { headingTextFor } from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { STATE } from '@/contexts/popup/state';
import { getMessage, type PathRule } from '@/utils';

const TEMPLATE_ID = 'advanced-path-rule-template';

export const buildRuleSection = (key: string, rule: PathRule) => {
  const template = document.getElementById(TEMPLATE_ID);

  if (!(template instanceof HTMLTemplateElement)) {
    return null;
  }

  const fragment = template.content.cloneNode(true);

  if (!(fragment instanceof DocumentFragment)) {
    return null;
  }

  const section = fragment.querySelector('.advanced-path-rule');
  const heading = fragment.querySelector('h3');
  const originInput = fragment.querySelector<HTMLInputElement>('.advanced-path-rules__origin');
  const datalist = fragment.querySelector('datalist');
  const deleteButton = fragment.querySelector('.advanced-path-rules__delete');

  if (!(section instanceof HTMLElement) || !heading || !originInput || !deleteButton) {
    return null;
  }

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

  return fragment;
};
