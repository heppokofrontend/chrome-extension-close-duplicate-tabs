import { UI } from '@/contexts/duplicates-list/constants';
import type { ValidTab } from '@/contexts/duplicates-list/types';

import { buildUrlSection } from './build-url-section';

export const renderDuplicates = (entries: [string, ValidTab[]][]) => {
  const fragment = document.createDocumentFragment();
  const closedMessage = chrome.i18n.getMessage('duplicates_already_closed');

  for (const [url, tabs] of entries) {
    const section = buildUrlSection(url, tabs, closedMessage);
    fragment.appendChild(section);
  }

  UI.container.appendChild(fragment);
};
