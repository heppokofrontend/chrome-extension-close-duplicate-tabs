import { registerAutoAvoidListeners } from '@/worker/features/auto-avoid-duplicates';
import { runCategorize } from '@/worker/features/categorize';
import { runCombine } from '@/worker/features/combine';
import { runDivide } from '@/worker/features/divide';
import { runReload } from '@/worker/features/reload';
import { runRemove } from '@/worker/features/remove-duplicates';
import { runSort } from '@/worker/features/sort';
import type { TaskRequest } from '@/worker/types';

registerAutoAvoidListeners();

chrome.runtime.onConnect.addListener((port) => {
  const onmessageListener = (request: TaskRequest) => {
    const callTaskFunctions = async ({ taskName, options }: TaskRequest) => {
      const saveData = options?.saveData ?? {};

      switch (taskName) {
        case 'remove':
          await runRemove({
            saveData,
            shouldShowDuplicatePage: options?.shouldShowDuplicatePage,
          });
          return;

        case 'reload':
          await runReload({ saveData });
          return;

        case 'categorize':
          await runCategorize({ saveData });
          return;

        case 'divide':
          await runDivide({ saveData });
          return;

        case 'combine':
          await runCombine({ saveData });
          return;

        case 'sort':
          await runSort({ saveData, sort: options?.sort });
          return;
      }
    };

    void callTaskFunctions(request);

    return true;
  };

  port.onMessage.addListener(onmessageListener);
});
