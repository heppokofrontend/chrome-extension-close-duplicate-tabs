import { afterEach, describe, expect, it, vi } from 'vitest';

const { getMessage } = vi.hoisted(() => ({
  getMessage: vi.fn((key: string) => `translated:${key}`),
}));

vi.mock('@/utils', async () => {
  const actual = await vi.importActual<typeof import('@/utils')>('@/utils');

  return { ...actual, getMessage };
});

/**
 * i18n はトップレベルで即座に実行されるモジュールのため、
 * DOM/chrome のスタブを整えてからモジュールを読み直す。
 */
const loadI18n = async (uiLanguage: string) => {
  vi.resetModules();
  getMessage.mockClear();

  vi.stubGlobal('chrome', { i18n: { getUILanguage: vi.fn().mockReturnValue(uiLanguage) } });

  await import('@/contexts/i18n');
};

describe('i18n bootstrap', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    document.documentElement.lang = '';
    document.body.innerHTML = '';
  });

  it('fills elements marked with data-i18n using their key', async () => {
    document.body.innerHTML = `
      <p data-i18n="greeting"></p>
      <span data-i18n="farewell">placeholder</span>
    `;

    await loadI18n('en-US');

    expect(document.querySelector('p')?.textContent).toBe('translated:greeting');
    expect(document.querySelector('span')?.textContent).toBe('translated:farewell');
  });

  it('leaves elements with an empty data-i18n untouched', async () => {
    document.body.innerHTML = '<p data-i18n="">keep me</p>';

    await loadI18n('en-US');

    expect(document.querySelector('p')?.textContent).toBe('keep me');
    expect(getMessage).not.toHaveBeenCalled();
  });

  it('sets <html lang> to "ja" for Japanese UI locales', async () => {
    await loadI18n('ja-JP');

    expect(document.documentElement.lang).toBe('ja');
  });

  it('falls back to "en" for non-Japanese UI locales', async () => {
    await loadI18n('fr');

    expect(document.documentElement.lang).toBe('en');
  });
});
