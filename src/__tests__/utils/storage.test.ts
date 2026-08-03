import { describe, it, expect, vi, afterEach } from 'vitest';

import { defaultSaveData, getLocalStorage, setSaveData } from '@/utils';

const mockStoredSaveData = (value: unknown) => {
  const get = vi.fn().mockResolvedValue({ saveData: value });

  vi.stubGlobal('chrome', { storage: { local: { get } } });
};

const mockStoredDialogOpenStatus = (value: unknown) => {
  const get = vi.fn().mockResolvedValue({ dialogOpenStatus: value });

  vi.stubGlobal('chrome', { storage: { local: { get } } });
};

const mockStorageSet = (set = vi.fn().mockResolvedValue(undefined)) => {
  vi.stubGlobal('chrome', { storage: { local: { set } } });

  return set;
};

describe('getLocalStorage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('falls back to defaults for undefined or non-object stored value', async () => {
    mockStoredSaveData(undefined);
    expect(await getLocalStorage('saveData')).toStrictEqual(defaultSaveData);

    mockStoredSaveData(null);
    expect(await getLocalStorage('saveData')).toStrictEqual(defaultSaveData);

    mockStoredSaveData('nope');
    expect(await getLocalStorage('saveData')).toStrictEqual(defaultSaveData);
  });

  it('merges saved fields with defaults, keeping unset fields at their default', async () => {
    mockStoredSaveData({ ignorePathname: true, noConfirm: true });
    expect(await getLocalStorage('saveData')).toStrictEqual({
      ...defaultSaveData,
      ignorePathname: true,
      noConfirm: true,
    });
  });

  it('does not mutate the defaults object', async () => {
    const defaultsCopy = { ...defaultSaveData };

    mockStoredSaveData({ ignorePathname: true });
    await getLocalStorage('saveData');
    expect(defaultSaveData).toStrictEqual(defaultsCopy);
  });

  it('returns the stored value for dialogOpenStatus when it is a boolean record', async () => {
    mockStoredDialogOpenStatus({ dangerZone: true, advancedPathRules: false });
    expect(await getLocalStorage('dialogOpenStatus')).toStrictEqual({
      dangerZone: true,
      advancedPathRules: false,
    });
  });

  it('falls back to an empty object for dialogOpenStatus when the stored value is not a boolean record', async () => {
    mockStoredDialogOpenStatus(undefined);
    expect(await getLocalStorage('dialogOpenStatus')).toStrictEqual({});

    mockStoredDialogOpenStatus({ dangerZone: 'yes' });
    expect(await getLocalStorage('dialogOpenStatus')).toStrictEqual({});

    mockStoredDialogOpenStatus('nope');
    expect(await getLocalStorage('dialogOpenStatus')).toStrictEqual({});
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
