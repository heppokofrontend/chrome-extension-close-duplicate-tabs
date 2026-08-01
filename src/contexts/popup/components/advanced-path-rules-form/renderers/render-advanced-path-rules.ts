import { buildRuleSection } from '@/contexts/popup/components/advanced-path-rules-form/effects';
import { UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';

/** storage から読み込んだ advancedPathRules を元に、保存済みルールの UI を復元する。 */
export const renderAdvancedPathRules = () => {
  for (const [key, rule] of Object.entries(STATE.saveData.advancedPathRules)) {
    const fragment = buildRuleSection(key, rule);

    if (fragment) {
      UI.advancedPathRulesContainer.append(fragment);
    }
  }
};
