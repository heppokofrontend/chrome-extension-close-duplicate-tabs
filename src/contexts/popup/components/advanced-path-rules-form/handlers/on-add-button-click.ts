import { buildRuleSection } from '@/contexts/popup/components/advanced-path-rules-form/renderers/build-rule-section';
import { patchRule } from '@/contexts/popup/components/advanced-path-rules-form/utils';
import { POPUP_UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';
import { type PathRule } from '@/utils';

export const onAddButtonClick = () => {
  const key = String(performance.now());
  const initialRule: PathRule = {
    origin: '',
    pathname: STATE.saveData.ignorePathname,
    query: STATE.saveData.ignoreQuery,
    hash: STATE.saveData.ignoreHash,
    allowedQueryParams: '',
  };

  const fragment = buildRuleSection(key, initialRule);

  POPUP_UI.advancedPathRulesContainer.append(fragment);

  const addedSection = POPUP_UI.advancedPathRulesContainer.lastElementChild;

  if (typeof addedSection?.scrollIntoView === 'function') {
    addedSection.scrollIntoView({ block: 'center', behavior: 'smooth' });
  }

  patchRule(key, initialRule);
};
