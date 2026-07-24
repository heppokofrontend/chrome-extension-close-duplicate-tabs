# CHANGELOG

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
