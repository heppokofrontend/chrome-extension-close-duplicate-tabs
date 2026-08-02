import type { TaskName } from '@/types';

import { requestCategorize } from './categorize';
import { requestCombine } from './combine';
import { requestDivide } from './divide';
import { requestReload } from './reload';
import { requestRemove } from './remove';
import { requestSort } from './sort';

export const runTask = (taskName: TaskName) => {
  switch (taskName) {
    case 'remove':
      return requestRemove();
    case 'reload':
      return requestReload();
    case 'combine':
      return requestCombine();
    case 'divide':
      return requestDivide();
    case 'sort':
      return requestSort();
    case 'categorize':
      return requestCategorize();
  }
};
