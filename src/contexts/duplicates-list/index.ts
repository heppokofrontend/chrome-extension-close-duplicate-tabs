import { initFocusCurrentWindowButton } from '@/contexts/duplicates-list/components/focus-current-window-button';
import { renderDuplicates } from '@/contexts/duplicates-list/components/report';
import type { ValidTab } from '@/contexts/duplicates-list/components/report/types';
import { getStorage } from '@/utils';

void getStorage('saveData').then((saveData) => {
  document.body.dataset['includeAllWindow'] = String(saveData.includeAllWindow);
});

const init = async () => {
  await initFocusCurrentWindowButton();

  const { duplicatedEntries } = await chrome.storage.session.get('duplicatedEntries');
  const typedDuplicatedEntries = Array.isArray(duplicatedEntries)
    ? (duplicatedEntries as [string, ValidTab[]][])
    : [];

  renderDuplicates(typedDuplicatedEntries);
};

void init();
