import { describe, it, expect, vi, afterEach } from 'vitest';

import { getMessage } from '@/utils';

const mockGetMessage = (fn: (key: string, substitutions?: string | string[]) => string) => {
  vi.stubGlobal('chrome', { i18n: { getMessage: fn } });
};

describe('getMessage', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns the message from chrome.i18n.getMessage', () => {
    mockGetMessage((key) => (key === 'greeting' ? 'hello' : ''));

    expect(getMessage('greeting')).toBe('hello');
  });

  it('forwards substitutions to chrome.i18n.getMessage', () => {
    const get = vi.fn().mockReturnValue('hello, world');
    mockGetMessage(get);

    expect(getMessage('greeting', ['world'])).toBe('hello, world');
    expect(get).toHaveBeenCalledWith('greeting', ['world']);
  });

  it('throws when chrome.i18n.getMessage returns an empty string', () => {
    mockGetMessage(() => '');

    expect(() => getMessage('missing_key')).toThrow('i18n message not found: missing_key');
  });

  it('does not throw on an empty string when options.allowEmpty is true', () => {
    mockGetMessage(() => '');

    expect(getMessage('optional_key', undefined, { allowEmpty: true })).toBe('');
  });

  it('accepts options as the second argument when substitutions are omitted', () => {
    const get = vi.fn().mockReturnValue('');
    mockGetMessage(get);

    expect(getMessage('optional_key', { allowEmpty: true })).toBe('');
    expect(get).toHaveBeenCalledWith('optional_key', undefined);
  });
});
