import { UI } from '@/contexts/popup/constants';
import { STATE } from '@/contexts/popup/state';

export const renderDatalist = () => {
  const history = STATE.saveData.inputHistory.advancedPathRuleOrigin ?? [];
  const candidates = [
    STATE.editingOriginBeforeValue,
    ...(STATE.currentTabOrigin ? [STATE.currentTabOrigin, ...history] : history),
  ];

  UI.advancedPathRuleDatalist.textContent = '';

  for (const value of [...new Set(candidates)].filter(Boolean)) {
    const option = document.createElement('option');
    option.value = value;
    UI.advancedPathRuleDatalist.append(option);
  }
};
