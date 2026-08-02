import { RULE_CHECKBOX_FIELDS } from '@/contexts/popup/components/advanced-path-rules-form/constants';
import {
  headingTextFor,
  patchRule,
} from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { getMessage } from '@/utils';

export const onOriginInput = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const { key } = e.currentTarget.dataset;

  if (key === undefined || key === '') {
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
