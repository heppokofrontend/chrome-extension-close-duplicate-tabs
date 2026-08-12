# CHANGELOG

## v1.5.9

- Dialogs (confirm/choices/range) can now be dismissed with Escape or a backdrop click, resolving as canceled instead of leaving the action hanging indefinitely.
- Fixed Escape closing the extension popup itself instead of just the open dialog.

## v1.5.8

- Duplicates list: added a "Last Accessed" column showing each tab's last-viewed time as a relative duration (seconds/minutes/hours/days).
- Added a "By last viewed" sort option to order duplicate tabs by last-accessed time, oldest first.
- Clarified the Japanese sort labels ("URL順"/"ページ名順") to avoid implying priority ordering.
- Advanced Path Rule: the Origin field now prioritizes the current tab's origin at the top of the suggestion list.
- Bumped `minimum_chrome_version` to 121, the minimum version exposing `lastAccessed`.
- Fixed the "categorize by hostname" dialog crashing on open in Japanese, caused by an intentionally empty ja translation being misread as a missing one.

## v1.5.7

- Duplicates list: added a button to close a tab directly from the list, without needing to switch to it first.
- Duplicates list: fixed the "already closed" status message not being shown due to a missing translation key.

## v1.5.6

- Advanced Path Rule: added an allowlist of query parameters (`allowedQueryParams`) that survive the "ignore query" setting, so params like video/page IDs can be kept even while tracking params are dropped.
- Fixed the advanced path rule section heading and Add button labels not being localized.
- Fixed a case where the auto-avoid-duplicates feature could close a newly opened background tab (e.g. middle-click/Ctrl+click) without switching back to the existing tab, if the user activated the new tab while it was still being processed.

## v1.5.5

- Advanced Path Rule: the Origin field now remembers recently entered origins and offers them as recoverable datalist suggestions, so an accidental overwrite of a previously entered value can be restored.
- Fixed the duplicates list's sticky table header being hidden behind row content while scrolling.

## v1.5.4

- The Danger Zone and Advanced Path Rules sections now animate open/close with a smooth transition instead of snapping instantly.
- Buttons, labels, and section headers now brighten on hover instead of dimming, and the hover effect now also applies to labels.

## v1.5.3

- Advanced Path Rule: the Origin/Host field now suggests the current tab's origin as a placeholder and dropdown option, making it faster to add a rule for the site you're on.
- Fixed settings that failed to save from silently reverting later; save failures are now surfaced with an alert and the UI is rolled back to the last saved value immediately.
- Improved internal code quality: added automated lint/format checks before each commit and expanded test coverage.

## v1.5.2

- Improved browser UI language support for locale variants such as `ja-JP`, so the extension now better matches Japanese UI settings.
- Improved internal code organization for better reliability and easier future updates.

## v1.5.1

- Fixed the document language attribute not matching the browser's UI language, which could affect accessibility/screen readers.

## v1.5.0

- Added advanced path rule settings: you can now override the duplicate-matching rule (ignore pathname / query / hash) per origin (scheme + host + port), instead of only a single global Default setting.
- Fixed a case where a saved per-origin rule could silently fail to match if the origin was entered without a scheme.
- Fixed the advanced path rule row's screen-reader labels being Japanese-only regardless of the browser's language.

## v1.4.1

- No functional changes. Internal code restructuring (popup module split, centralized type guards).

## v1.4.0

- Added a duplicate count badge on the extension icon, with selectable modes (off / count across all windows / count in the current window).

## v1.3.0

- Added an option to automatically close new duplicate tabs the moment they are opened.
- Fixed cases where URL normalization options (such as "ignore hash") were not being applied when closing duplicate tabs.
- Duplicates list: fixed a crash that could occur when opening the list, and hardened the list against special characters in tab titles.
- Fixed a bug that could steal focus from a background window when a duplicate tab was closed.
- Fixed the categorize-range number input so that clearing it no longer breaks the setting.
- The "Open tab" button label in the duplicates list is now localized (previously Japanese-only).

## v1.2.4

- No functional changes. Internal build tooling and development workflow modernized (npm, esbuild, stricter TypeScript, tests, CI).
- Requires Chrome 120 or later.

## v1.2.3

- When targeting all windows, modified to prioritize closing tabs that are not in the current window.

## v1.2.2

- Improved the tab closing logic to handle duplicates correctly.

## v1.2.1

- Rollback to 1.1.0

## v1.2.0

- "Close duplicate tabs" button now allows users to review a list of duplicate tabs before closing them.

## v1.1.0

- Added a flag to forcibly update the URL when clicking on intra-page links, such as those in the table of contents.

## v1.0.3

- Update English
- Change to use dialog on all task button
- Fix confirm dialog bugs

## v1.0.2

- Update function "Divide all tabs for each hostname"
  - Option added to group tabs into the same window according to the number of sheets when there are only a few tabs with the same hostname.

## v1.0.1

- Fix critical bug that is not able to load savedata

## v1.0.0

- Stable release
