import type { ValidTab } from '@/contexts/duplicates-list/components/report/types';

import { renderDuplicates } from './renderers';

export const initReport = async () => {
  const { duplicatedEntries } = await chrome.storage.session.get('duplicatedEntries');
  const typedDuplicatedEntries: [string, ValidTab[]][] = Array.isArray(duplicatedEntries)
    ? (duplicatedEntries as [string, ValidTab[]][])
    : [];

  renderDuplicates(typedDuplicatedEntries);
};
