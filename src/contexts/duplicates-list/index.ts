import { initFocusCurrentWindowButton } from '@/contexts/duplicates-list/components/focus-current-window-button';
import { renderDuplicates } from '@/contexts/duplicates-list/components/report';
import { getLocalStorage } from '@/utils';

void getLocalStorage('saveData').then((saveData) => {
  document.body.dataset['includeAllWindow'] = String(saveData.includeAllWindow);
});

const init = async () => {
  await initFocusCurrentWindowButton();
  await renderDuplicates();

  // CSS Transitionの有効化
  setTimeout(() => {
    document.body.dataset['transition'] = 'ready';
  }, 300);
};

void init();
