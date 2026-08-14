import { LIST_UI } from '@/contexts/duplicates-list/constants';
import { getSessionStorage } from '@/utils';

import { buildUrlSection } from './build-url-section';

export const renderDuplicates = async () => {
  const entries = await getSessionStorage('duplicatedEntries');

  const fragment = document.createDocumentFragment();

  for (const [url, tabs] of entries) {
    const section = buildUrlSection(url, tabs);
    fragment.appendChild(section);
  }

  LIST_UI.report.appendChild(fragment);
};
