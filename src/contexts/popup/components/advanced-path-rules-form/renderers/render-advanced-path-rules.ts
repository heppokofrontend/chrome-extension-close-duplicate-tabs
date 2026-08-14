import { POPUP_UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';

import { buildRuleSection } from './build-rule-section';
import { renderDatalist } from './render-datalist';

/** storage から読み込んだ advancedPathRules を元に、保存済みルールの UI を復元する。 */
export const renderAdvancedPathRules = () => {
  for (const [key, rule] of Object.entries(STATE.saveData.advancedPathRules)) {
    const fragment = buildRuleSection(key, rule);
    POPUP_UI.advancedPathRulesContainer.append(fragment);
  }

  renderDatalist();
};
