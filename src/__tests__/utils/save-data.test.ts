import { describe, it, expect, vi, afterEach } from 'vitest';

import { applySaveDataPatch, defaultSaveData, getSaveData, setSaveData } from '@/utils';

const mockStoredSaveData = (value: unknown) => {
  const get = vi.fn().mockResolvedValue({ saveData: value });

  vi.stubGlobal('chrome', { storage: { local: { get } } });
};

const mockStorageSet = (set = vi.fn().mockResolvedValue(undefined)) => {
  vi.stubGlobal('chrome', { storage: { local: { set } } });

  return set;
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

describe('applySaveDataPatch', () => {
  it('overrides base fields with values from the patch', () => {
    const base = { ...defaultSaveData, noConfirm: true };

    expect(applySaveDataPatch(base, { noConfirm: false, ignorePathname: true })).toStrictEqual({
      ...defaultSaveData,
      noConfirm: false,
      ignorePathname: true,
    });
  });

  it('accumulates shown instead of replacing it wholesale', () => {
    const base = { ...defaultSaveData, shown: { ignorePathname: '2026-01-01' } };

    const result = applySaveDataPatch(base, { shown: { autoAvoidDuplicate: '2026-07-05' } });

    expect(result.shown).toStrictEqual({
      ignorePathname: '2026-01-01',
      autoAvoidDuplicate: '2026-07-05',
    });
  });

  it('lets a new shown key override an existing one with the same name', () => {
    const base = { ...defaultSaveData, shown: { autoAvoidDuplicate: '2026-01-01' } };

    const result = applySaveDataPatch(base, { shown: { autoAvoidDuplicate: '2026-07-05' } });

    expect(result.shown).toStrictEqual({ autoAvoidDuplicate: '2026-07-05' });
  });

  it('does not mutate the base object', () => {
    const base = { ...defaultSaveData, shown: { ignorePathname: '2026-01-01' } };
    const snapshot = structuredClone(base);

    applySaveDataPatch(base, { noConfirm: true, shown: { autoAvoidDuplicate: '2026-07-05' } });

    expect(base).toStrictEqual(snapshot);
  });
});

describe('setSaveData', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('writes the given value to storage as-is', async () => {
    const set = mockStorageSet();
    const value = { ...defaultSaveData, noConfirm: true };

    await setSaveData(value);

    expect(set).toHaveBeenCalledWith({ saveData: value });
  });

  it('serializes concurrent writes so the second waits for the first to finish', async () => {
    let resolveFirst!: () => void;
    // 1本目の set をテスト側で握って解放できるようにする deferred。
    const firstSet = new Promise<void>((resolve) => {
      resolveFirst = resolve;
    });
    const set = mockStorageSet(vi.fn().mockReturnValueOnce(firstSet).mockResolvedValue(undefined));

    const first = { ...defaultSaveData, noConfirm: true };
    const second = { ...defaultSaveData, ignorePathname: true };
    const firstDone = setSaveData(first);
    const secondDone = setSaveData(second);

    // 1本目 set のディスパッチを待つ。直列化が壊れて2本目まで走っていればここで失敗する。
    await vi.waitFor(() => {
      expect(set).toHaveBeenCalledTimes(1);
    });
    expect(set).toHaveBeenNthCalledWith(1, { saveData: first });

    resolveFirst();
    await Promise.all([firstDone, secondDone]);

    expect(set).toHaveBeenCalledTimes(2);
    expect(set).toHaveBeenNthCalledWith(2, { saveData: second });
  });

  it('keeps accepting writes after an earlier one rejects', async () => {
    const set = mockStorageSet(
      vi.fn().mockRejectedValueOnce(new Error('storage unavailable')).mockResolvedValue(undefined),
    );

    const first = { ...defaultSaveData, noConfirm: true };
    const second = { ...defaultSaveData, ignorePathname: true };

    await expect(setSaveData(first)).rejects.toThrow('storage unavailable');
    await setSaveData(second);

    expect(set).toHaveBeenNthCalledWith(2, { saveData: second });
  });
});
