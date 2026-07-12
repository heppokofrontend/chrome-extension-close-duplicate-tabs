import { describe, it, expect } from 'vitest';

import { isUpdateBadgeMode, isValidOptionType } from '@/utils/type-guard';

describe('isUpdateBadgeMode', () => {
  it.each(['none', 'all', 'current'])('accepts %s', (value) => {
    expect(isUpdateBadgeMode(value)).toBe(true);
  });

  it.each(['', 'NONE', 'always', 'false', ' none'])('rejects %j', (value) => {
    expect(isUpdateBadgeMode(value)).toBe(false);
  });
});

describe('isValidOptionType', () => {
  it.each([
    'ignorePathname',
    'ignoreQuery',
    'ignoreHash',
    'includeAllWindow',
    'includePinnedTabs',
    'forcedChangeURLWhenClickedAnchorLink',
    'noConfirm',
    'minCategorizeNumber',
    'autoAvoidDuplicate',
    'updateBadgeMode',
    'shown',
  ])('accepts %s', (value) => {
    expect(isValidOptionType(value)).toBe(true);
  });

  it.each(['', 'notAKey', 'IGNOREPATHNAME'])('rejects %j', (value) => {
    expect(isValidOptionType(value)).toBe(false);
  });

  it.each([undefined, null, 1, true, {}, []])('rejects non-string %j', (value) => {
    expect(isValidOptionType(value)).toBe(false);
  });
});
