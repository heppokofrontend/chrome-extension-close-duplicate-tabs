import { UI } from '@/contexts/duplicates-list/constants';
import { getSessionStorage } from '@/utils';

import { buildUrlSection } from './build-url-section';

export const renderDuplicates = async () => {
  const entries = await getSessionStorage('duplicatedEntries');

  const fragment = document.createDocumentFragment();
  const closedMessage = chrome.i18n.getMessage('duplicates_already_closed');

  for (const [url, tabs] of entries) {
    const section = buildUrlSection(url, tabs, closedMessage);
    fragment.appendChild(section);
  }

  UI.report.appendChild(fragment);
};
