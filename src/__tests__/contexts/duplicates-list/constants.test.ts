import { describe, expect, it } from 'vitest';

import duplicatesListHtml from '@package/duplicates-list.html?raw';

describe('duplicates-list constants.ts UI', () => {
  it('every UI selector matches at least one element in the real duplicates-list.html', async () => {
    const body = /<body>([\s\S]*)<\/body>/.exec(duplicatesListHtml)?.[1] ?? '';
    document.body.innerHTML = body;

    const { UI } = await import('@/contexts/duplicates-list/constants');

    expect(UI.returnButton).not.toBeNull();
    expect(UI.container).not.toBeNull();
  });
});
