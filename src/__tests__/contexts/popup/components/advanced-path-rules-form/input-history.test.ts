import { beforeEach, describe, expect, it, vi } from 'vitest';

const { STATE } = vi.hoisted(() => {
  const STATE: {
    saveData: { inputHistory: Partial<Record<string, string[]>> };
  } = {
    saveData: { inputHistory: {} },
  };

  return { STATE };
});

vi.mock('@/contexts/popup/state', () => ({ STATE }));

const { INPUT_HISTORY_MAX_ENTRIES, createInputHistoryPatch } =
  await import('@/contexts/popup/components/advanced-path-rules-form/utils/input-history');

const KEY = 'advancedPathRuleOrigin';

beforeEach(() => {
  STATE.saveData.inputHistory = {};
});

describe('createInputHistoryPatch', () => {
  it('adds the value to an empty history', () => {
    expect(createInputHistoryPatch({ key: KEY, value: 'https://a.example' })).toStrictEqual({
      [KEY]: ['https://a.example'],
    });
  });

  it('trims surrounding whitespace before adding', () => {
    expect(createInputHistoryPatch({ key: KEY, value: '  https://a.example  ' })).toStrictEqual({
      [KEY]: ['https://a.example'],
    });
  });

  it('returns null for an empty or whitespace-only value', () => {
    expect(createInputHistoryPatch({ key: KEY, value: '' })).toBeNull();
    expect(createInputHistoryPatch({ key: KEY, value: '   ' })).toBeNull();
  });

  it('moves a re-added value to the front instead of duplicating it', () => {
    STATE.saveData.inputHistory[KEY] = [
      'https://a.example',
      'https://b.example',
      'https://c.example',
    ];

    expect(createInputHistoryPatch({ key: KEY, value: 'https://b.example' })).toStrictEqual({
      [KEY]: ['https://b.example', 'https://a.example', 'https://c.example'],
    });
  });

  it(`keeps only the latest ${INPUT_HISTORY_MAX_ENTRIES} entries`, () => {
    STATE.saveData.inputHistory[KEY] = [
      'https://a.example',
      'https://b.example',
      'https://c.example',
      'https://d.example',
      'https://e.example',
    ];

    expect(createInputHistoryPatch({ key: KEY, value: 'https://f.example' })).toStrictEqual({
      [KEY]: [
        'https://f.example',
        'https://a.example',
        'https://b.example',
        'https://c.example',
        'https://d.example',
      ],
    });
  });
});
