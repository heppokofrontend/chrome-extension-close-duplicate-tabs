import { registerAutoAvoidListeners } from '@/worker/auto-avoid-duplicates';
import { categorizeTabs } from '@/worker/categorize';
import { combineTabs } from '@/worker/combine';
import { divideTabs } from '@/worker/divide';
import { removeDuplicatedTabs } from '@/worker/remove-duplicates';
import { sortTabs } from '@/worker/sort';
import type { TaskRequest } from '@/worker/types';
import { getTabs } from '@/worker/utils';

registerAutoAvoidListeners();

chrome.runtime.onConnect.addListener((port) => {
  const onmessageListener = (request: TaskRequest) => {
    const callTaskFunctions = async ({ taskName, options }: TaskRequest) => {
      const saveData = options?.saveData;

      const tabs = await getTabs({
        // combine は常に全ウィンドウ対象。それ以外は includeAllWindow 設定に従う。
        includeAllWindow: taskName === 'combine' || (saveData?.includeAllWindow ?? false),
        includePinnedTabs: saveData?.includePinnedTabs ?? false,
      });

      switch (taskName) {
        case 'remove':
          await removeDuplicatedTabs({
            tabs,
            options: {
              saveData: saveData ?? {},
              shouldShowDuplicatePage: options?.shouldShowDuplicatePage,
            },
          });
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
          await categorizeTabs(tabs, saveData?.minCategorizeNumber);
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
