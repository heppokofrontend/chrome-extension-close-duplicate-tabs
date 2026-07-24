import { afterEach, describe, expect, it, vi } from 'vitest';

const { setSaveData, getMessage } = vi.hoisted(() => ({
  setSaveData: vi.fn(),
  getMessage: vi.fn().mockReturnValue('error message'),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, setSaveData, getMessage };
});

describe('save', () => {
  afterEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
  });

  it('applies the patch to STATE.saveData and persists it', async () => {
    setSaveData.mockResolvedValue(undefined);

    const { STATE, save } = await import('@/contexts/popup/utils/state');

    save({ noConfirm: true });

    expect(STATE.saveData).toStrictEqual({ ...STATE.saveData, noConfirm: true });
    expect(setSaveData).toHaveBeenCalledWith(STATE.saveData);
  });

  it('rolls back STATE and alerts the user when persisting fails', async () => {
    setSaveData.mockRejectedValue(new Error('storage unavailable'));
    vi.stubGlobal('alert', vi.fn());
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    const { STATE, save } = await import('@/contexts/popup/utils/state');
    const previous = STATE.saveData;

    save({ noConfirm: true });

    // setSaveData の rejection ハンドラは非同期で走るため、マイクロタスクの完了を待つ。
    await vi.waitFor(() => {
      expect(STATE.saveData).toBe(previous);
    });

    expect(window.alert).toHaveBeenCalledWith('error message');
    expect(getMessage).toHaveBeenCalledWith('error_saveFailed');

    vi.unstubAllGlobals();
  });
});
