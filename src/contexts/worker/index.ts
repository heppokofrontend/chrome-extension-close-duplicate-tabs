import {
  registerAutoAvoidListeners,
  registerUpdateBadgeListeners,
  runCategorize,
  runCombine,
  runDivide,
  runGather,
  runReload,
  runRemove,
  runSort,
} from '@/contexts/worker/features';
import type { TaskRequest } from '@/types';

registerAutoAvoidListeners();
registerUpdateBadgeListeners();

chrome.runtime.onConnect.addListener((port) => {
  const onmessageListener = (request: TaskRequest) => {
    switch (request.taskName) {
      case 'remove':
        void runRemove(request.options);
        return;

      case 'reload':
        void runReload(request.options);
        return;

      case 'categorize':
        void runCategorize(request.options);
        return;

      case 'divide':
        void runDivide(request.options);
        return;

      case 'gather':
        void runGather({
          saveData: request.options.saveData,
          origin: request.options.origin,
          scope: request.options.gatherScope,
          destination: request.options.gatherDestination,
        });
        return;

      case 'combine':
        void runCombine(request.options);
        return;

      case 'sort':
        void runSort(request.options);
        return;
    }
  };

  port.onMessage.addListener(onmessageListener);
});
