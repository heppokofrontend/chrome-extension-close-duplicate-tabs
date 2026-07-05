import { describe, it, expect } from 'vitest';

import { defaultSaveData, mergeSaveData } from '@/utils';

describe('mergeSaveData', () => {
  it('falls back to defaults for undefined or non-object input', () => {
    expect(mergeSaveData(undefined, defaultSaveData)).toEqual(defaultSaveData);
    expect(mergeSaveData(null, defaultSaveData)).toEqual(defaultSaveData);
    expect(mergeSaveData('nope', defaultSaveData)).toEqual(defaultSaveData);
  });

  it('overrides defaults with the saved fields', () => {
    expect(mergeSaveData({ ignorePathname: true }, defaultSaveData)).toEqual({
      ...defaultSaveData,
      ignorePathname: true,
    });
  });

  it('fills in fields missing from a partial saved object', () => {
    expect(mergeSaveData({ noConfirm: true }, defaultSaveData)).toEqual({
      ...defaultSaveData,
      noConfirm: true,
    });
  });

  it('does not mutate the defaults object', () => {
    const defaultsCopy = { ...defaultSaveData };
    mergeSaveData({ ignorePathname: true }, defaultSaveData);
    expect(defaultSaveData).toEqual(defaultsCopy);
  });
});
