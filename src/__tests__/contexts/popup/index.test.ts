import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage, save, showNoticeModal } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => key),
  save: vi.fn(),
  showNoticeModal: vi.fn(),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

vi.mock('@/contexts/popup/state', async () => {
  const actual =
    await vi.importActual<typeof import('@/contexts/popup/state')>('@/contexts/popup/state');

  return { ...actual, save };
});

vi.mock('@/contexts/popup/components/dialogs', () => ({ showNoticeModal }));
vi.mock('@/contexts/popup/components/disclosures', () => ({ initDetailsElements: vi.fn() }));
vi.mock('@/contexts/popup/components/option-checkbox', () => ({ initOptionCheckboxes: vi.fn() }));
vi.mock('@/contexts/popup/components/option-select', () => ({ initOptionSelects: vi.fn() }));
vi.mock('@/contexts/popup/components/run-buttons', () => ({ initRunButtons: vi.fn() }));
vi.mock('@/contexts/popup/components/advanced-path-rules-form', () => ({
  renderAdvancedPathRules: vi.fn(),
  addAdvancedPathRuleListeners: vi.fn(),
}));

/** 保留中の microtask を掃き出す。 */
const flushPromises = async () => {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve();
  }
};

/**
 * popup/index.ts はトップレベルで `void init()` を実行するモジュールのため、
 * chrome/DOM のスタブを整えてからモジュールを読み直し、init の完了を待つ。
 */
const loadPopup = async (shown: Record<string, string>) => {
  vi.resetModules();
  vi.clearAllMocks();

  document.body.innerHTML = '<button id="show-update-info-button"></button>';

  const get = vi.fn().mockResolvedValue({ saveData: { shown }, disclosureOpenStatus: {} });
  const set = vi.fn().mockResolvedValue(undefined);
  const remove = vi.fn().mockResolvedValue(undefined);
  const query = vi.fn().mockResolvedValue([]);

  vi.stubGlobal('chrome', { storage: { local: { get, set, remove } }, tabs: { query } });

  await import('@/contexts/popup/index');
  await flushPromises();
};

const clickShowUpdateInfoButton = () => {
  document.querySelector<HTMLButtonElement>('#show-update-info-button')?.click();
};

describe('initAnnounceNewFeature (via popup init)', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records the current version without showing a badge on a fresh install', async () => {
    await loadPopup({});

    expect(save).toHaveBeenCalledWith({ shown: { 'update-announcement': 'v1.6.4' } });
    expect(
      document.querySelector('#show-update-info-button')?.getAttribute('data-checked'),
    ).toBeNull();
  });

  it('shows a badge for an existing user who has not seen this version yet, and shows the modal on click', async () => {
    await loadPopup({ autoAvoidDuplicate: '2026-01-01T00:00:00.000Z' });

    expect(save).not.toHaveBeenCalled();
    expect(document.querySelector('#show-update-info-button')?.getAttribute('data-checked')).toBe(
      'false',
    );

    clickShowUpdateInfoButton();

    expect(showNoticeModal).toHaveBeenCalledTimes(1);

    const { cleanup } = showNoticeModal.mock.calls[0]?.[0] as { cleanup: () => void };
    cleanup();

    expect(save).toHaveBeenCalledWith({ shown: { 'update-announcement': 'v1.6.4' } });
    expect(document.querySelector('#show-update-info-button')?.getAttribute('data-checked')).toBe(
      'true',
    );
  });

  it('does not show a badge when the user has already seen this version, but the modal still opens on click', async () => {
    await loadPopup({ 'update-announcement': 'v1.6.4' });

    expect(save).not.toHaveBeenCalled();
    expect(
      document.querySelector('#show-update-info-button')?.getAttribute('data-checked'),
    ).toBeNull();

    clickShowUpdateInfoButton();

    expect(showNoticeModal).toHaveBeenCalledTimes(1);
  });
});
