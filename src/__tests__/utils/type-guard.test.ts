import { describe, it, expect } from 'vitest';

import {
  isUpdateBadgeMode,
  isValidOptionType,
  isValidSortType,
  isValidTaskName,
} from '@/utils/type-guard';

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

describe('isValidSortType', () => {
  it.each(['sortByUrl', 'sortByTitle', 'sortByHostAndTitle'])('accepts %s', (value) => {
    expect(isValidSortType(value)).toBe(true);
  });

  it.each(['', 'sortByUrl ', undefined, null, 1, {}, []])('rejects %j', (value) => {
    expect(isValidSortType(value)).toBe(false);
  });
});

describe('isValidTaskName', () => {
  it.each(['remove', 'reload', 'combine', 'divide', 'sort', 'categorize'])(
    'accepts %s',
    (value) => {
      expect(isValidTaskName(value)).toBe(true);
    },
  );

  it.each(['', 'unknownTask', undefined, null, 1, {}, []])('rejects %j', (value) => {
    expect(isValidTaskName(value)).toBe(false);
  });
});
