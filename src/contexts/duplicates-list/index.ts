import { initFocusCurrentWindowButton } from '@/contexts/duplicates-list/components/focus-current-window-button';
import { renderDuplicates } from '@/contexts/duplicates-list/components/report';
import { getStorage } from '@/utils';

void getStorage('saveData').then((saveData) => {
  document.body.dataset['includeAllWindow'] = String(saveData.includeAllWindow);
});

const init = async () => {
  await initFocusCurrentWindowButton();

  const { duplicatedEntries } = await chrome.storage.session.get('duplicatedEntries');

  renderDuplicates(duplicatedEntries);
};

void init();
