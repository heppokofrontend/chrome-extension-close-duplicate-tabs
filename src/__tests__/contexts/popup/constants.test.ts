import { describe, expect, it } from 'vitest';

import popupHtml from '@package/popup.html?raw';

describe('popup constants.ts UI', () => {
  it('every UI selector matches at least one element in the real popup.html', async () => {
    const body = /<body>([\s\S]*)<\/body>/.exec(popupHtml)?.[1] ?? '';
    document.body.innerHTML = body;

    const { UI } = await import('@/contexts/popup/constants');

    expect(UI.runButtons.length).toBeGreaterThan(0);
    expect(UI.optionCheckboxes.length).toBeGreaterThan(0);
    expect(UI.optionSelects.length).toBeGreaterThan(0);
    expect(UI.details.length).toBeGreaterThan(0);
    expect(UI.advancedPathRulesContainer).not.toBeNull();
    expect(UI.advancedPathRuleTemplate).not.toBeNull();
    expect(UI.advancedPathRuleAddButton).not.toBeNull();
  });
});
