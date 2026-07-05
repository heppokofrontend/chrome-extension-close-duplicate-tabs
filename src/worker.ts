import type { SaveDataType } from '@/utils';
import { categorizeTabs } from '@/worker/categorize';
import { combineTabs } from '@/worker/combine';
import { divideTabs } from '@/worker/divide';
import { removeDuplicatedTabs } from '@/worker/remove-duplicates';
import { sortTabs, type SortType } from '@/worker/sort';

chrome.runtime.onConnect.addListener((port) => {
  interface Request {
    taskName?: string;
    options?: SaveDataType & { sort: SortType; shouldShowDuplicatePage: boolean };
  }

  const onmessageListener = (request: Request) => {
    const callTaskFunctions = async ({ taskName, options }: Request) => {
      const currentWindow = taskName !== 'combine' && !options?.includeAllWindow ? true : undefined;
      const pinned = options?.includePinnedTabs ? undefined : false;
      const tabs = await chrome.tabs.query({
        windowType: 'normal',
        currentWindow,
        pinned,
      });

      switch (taskName) {
        case 'remove':
          await removeDuplicatedTabs(tabs, options ?? {});
          return;

        case 'reload':
          for (const { id } of tabs) {
            if (typeof id === 'number') {
              // NOTE: リロード後に音声を停止させる処理を実装したいが、現状 tabs 経由では不可能な模様
              void chrome.tabs.reload(id);
            }
          }

          return;

        case 'categorize':
          await categorizeTabs(tabs, options?.minCategorizeNumber);
          return;

        case 'divide':
          await divideTabs(tabs);
          return;

        case 'combine':
          await combineTabs(tabs);
          return;

        case 'sort':
          await sortTabs(tabs, options?.sort);
          return;
      }
    };

    void callTaskFunctions(request);

    return true;
  };

  port.onMessage.addListener(onmessageListener);
});
