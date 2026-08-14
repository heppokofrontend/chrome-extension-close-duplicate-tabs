import { describe, expect, it } from 'vitest';

import duplicatesListHtml from '@package/duplicates-list.html?raw';

describe('duplicates-list constants.ts LIST_UI', () => {
  it('every LIST_UI selector matches at least one element in the real duplicates-list.html', async () => {
    const body = /<body>([\s\S]*)<\/body>/.exec(duplicatesListHtml)?.[1] ?? '';
    document.body.innerHTML = body;

    const { LIST_UI } = await import('@/contexts/duplicates-list/constants');

    expect(LIST_UI.focusCurrentWindowButton).not.toBeNull();
    expect(LIST_UI.report).not.toBeNull();
  });
});
