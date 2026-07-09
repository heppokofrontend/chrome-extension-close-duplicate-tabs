import { describe, it, expect } from 'vitest';

import { isUpdateBadgeMode } from '@/utils/type-guard';

describe('isUpdateBadgeMode', () => {
  it.each(['none', 'all', 'current'])('accepts %s', (value) => {
    expect(isUpdateBadgeMode(value)).toBe(true);
  });

  it.each(['', 'NONE', 'always', 'false', ' none'])('rejects %j', (value) => {
    expect(isUpdateBadgeMode(value)).toBe(false);
  });
});
