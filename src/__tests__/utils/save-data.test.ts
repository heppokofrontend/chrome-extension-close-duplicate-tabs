import { describe, it, expect, vi, afterEach } from 'vitest';

import { defaultSaveData, getSaveData } from '@/utils';

const mockStoredSaveData = (value: unknown) => {
  const get = vi.fn().mockResolvedValue({ saveData: value });

  vi.stubGlobal('chrome', { storage: { local: { get } } });
};

describe('getSaveData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to defaults for undefined or non-object stored value', async () => {
    mockStoredSaveData(undefined);
    expect(await getSaveData()).toStrictEqual(defaultSaveData);

    mockStoredSaveData(null);
    expect(await getSaveData()).toStrictEqual(defaultSaveData);

    mockStoredSaveData('nope');
    expect(await getSaveData()).toStrictEqual(defaultSaveData);
  });

  it('merges saved fields with defaults, keeping unset fields at their default', async () => {
    mockStoredSaveData({ ignorePathname: true, noConfirm: true });
    expect(await getSaveData()).toStrictEqual({
      ...defaultSaveData,
      ignorePathname: true,
      noConfirm: true,
    });
  });

  it('does not mutate the defaults object', async () => {
    const defaultsCopy = { ...defaultSaveData };

    mockStoredSaveData({ ignorePathname: true });
    await getSaveData();
    expect(defaultSaveData).toStrictEqual(defaultsCopy);
  });
});
