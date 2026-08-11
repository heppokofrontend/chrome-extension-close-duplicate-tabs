import { describe, expect, it } from 'vitest';

import { escapeHtml } from '@/contexts/duplicates-list/utils';

describe('escapeHtml', () => {
  it('escapes &, <, >, ", and \'', () => {
    expect(escapeHtml(`&<>"'`)).toBe('&amp;&lt;&gt;&quot;&#39;');
  });

  it('leaves strings without special characters unchanged', () => {
    expect(escapeHtml('example title')).toBe('example title');
  });

  it('neutralizes script tags', () => {
    expect(escapeHtml('<script>alert(1)</script>')).toBe('&lt;script&gt;alert(1)&lt;/script&gt;');
  });
});
