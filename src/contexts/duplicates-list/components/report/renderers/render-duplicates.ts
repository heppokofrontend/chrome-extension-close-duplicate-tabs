import type { ValidTab } from '@/contexts/duplicates-list/components/report/types';
import { UI } from '@/contexts/duplicates-list/constants';

import { buildUrlSection } from './build-url-section';

const isDuplicateEntry = (entry: unknown): entry is [string, ValidTab[]] =>
  Array.isArray(entry) && typeof entry[0] === 'string' && Array.isArray(entry[1]);

export const renderDuplicates = (unsafeEntries: unknown) => {
  const entries = Array.isArray(unsafeEntries) ? unsafeEntries.filter(isDuplicateEntry) : [];

  const fragment = document.createDocumentFragment();
  const closedMessage = chrome.i18n.getMessage('duplicates_already_closed');

  for (const [url, tabs] of entries) {
    const section = buildUrlSection(url, tabs, closedMessage);
    fragment.appendChild(section);
  }

  UI.report.appendChild(fragment);
};
