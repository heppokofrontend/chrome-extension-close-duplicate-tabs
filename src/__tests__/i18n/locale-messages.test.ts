import { describe, it, expect } from 'vitest';

import enMessages from '@package/_locales/en/messages.json';
import jaMessages from '@package/_locales/ja/messages.json';
// HTML scanned for data-i18n keys. Add new package/ HTML files here too.
import duplicatesListHtml from '@package/duplicates-list.html?raw';
import popupHtml from '@package/popup.html?raw';

type Messages = Record<string, { message: string }>;

// Separator used when concatenating select_for_screen_reader_* with option_* for
// each locale (see the test below). en reads naturally with a space; ja reads
// naturally with no separator.
const localeEntries: [locale: string, messages: Messages, separator: string][] = [
  ['en', enMessages, ' '],
  ['ja', jaMessages, ''],
];
const htmlSources = [popupHtml, duplicatesListHtml];
const UPDATE_BADGE_MODES = ['none', 'all', 'current'] as const;

describe('_locales/*/messages.json', () => {
  it('every locale has the same set of keys', () => {
    // Key-set equality is checked at the type level. Missing/extra keys are caught by tsc,
    // not at runtime. (Possible because JSON imports get literal key types. Value contents
    // can't be checked by types, so that's covered by the test below.)
    const enCoversJa: Record<keyof typeof jaMessages, { message: string }> = enMessages;
    const jaCoversEn: Record<keyof typeof enMessages, { message: string }> = jaMessages;

    // The type check above is the real assertion; at runtime just confirm these are the same references.
    expect(enCoversJa).toBe(enMessages);
    expect(jaCoversEn).toBe(jaMessages);
  });

  it('every data-i18n key used in HTML exists in every locale', () => {
    const keysInHtml = new Set<string>();

    for (const html of htmlSources) {
      for (const [, key] of html.matchAll(/data-i18n="([^"]+)"/g)) {
        if (key) {
          keysInHtml.add(key);
        }
      }
    }

    expect(0 < keysInHtml.size).toBe(true);

    for (const [locale, messages] of localeEntries) {
      for (const key of keysInHtml) {
        expect(messages[key]?.message, `${locale}: ${key}`).toBeTruthy();
      }
    }
  });

  // select_visible_value_* (sighted-users-only, aria-hidden) must match word-for-word what a
  // screen reader announces (select_for_screen_reader_* + the selected option_*).
  it.each(localeEntries)(
    'updateBadgeMode visible value matches "lead text + option text" (%s)',
    (locale, messages, separator) => {
      const lead = messages['select_for_screen_reader_updateBadgeMode']?.message;

      expect(lead, 'select_for_screen_reader_updateBadgeMode').toBeTruthy();

      for (const mode of UPDATE_BADGE_MODES) {
        const option = messages[`option_updateBadgeMode_${mode}`]?.message;
        const visible = messages[`select_visible_value_updateBadgeMode_${mode}`]?.message;

        expect(option, `${locale}: option_updateBadgeMode_${mode}`).toBeTruthy();
        expect(visible, `${locale}: select_visible_value_updateBadgeMode_${mode}`).toBeTruthy();
        expect(visible, `${locale}: select_visible_value_updateBadgeMode_${mode}`).toBe(
          `${lead ?? ''}${separator}${option ?? ''}`,
        );
      }
    },
  );
});
