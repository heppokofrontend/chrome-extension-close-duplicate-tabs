import { describe, expect, it } from 'vitest';

import popupHtml from '@package/popup.html?raw';

describe('popup constants.ts POPUP_UI', () => {
  it('every UI selector matches at least one element in the real popup.html', async () => {
    const body = /<body>([\s\S]*)<\/body>/.exec(popupHtml)?.[1] ?? '';
    document.body.innerHTML = body;

    const { POPUP_UI } = await import('@/contexts/popup/constants');

    expect(POPUP_UI.runButtons.length).toBeGreaterThan(0);
    expect(POPUP_UI.optionCheckboxes.length).toBeGreaterThan(0);
    expect(POPUP_UI.optionSelects.length).toBeGreaterThan(0);
    expect(POPUP_UI.details.length).toBeGreaterThan(0);
    expect(POPUP_UI.advancedPathRulesContainer).not.toBeNull();
    expect(POPUP_UI.advancedPathRuleTemplate).not.toBeNull();
    expect(POPUP_UI.advancedPathRuleAddButton).not.toBeNull();
  });
});
