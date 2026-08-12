import type { TaskName } from '@/types';

import { sendCategorizeRequest } from './categorize';
import { sendCombineRequest } from './combine';
import { sendDivideRequest } from './divide';
import { sendReloadRequest } from './reload';
import { sendRemoveRequest } from './remove';
import { sendSortRequest } from './sort';

export const sendRequest = (taskName: TaskName) => {
  switch (taskName) {
    case 'remove':
      return sendRemoveRequest();
    case 'reload':
      return sendReloadRequest();
    case 'combine':
      return sendCombineRequest();
    case 'divide':
      return sendDivideRequest();
    case 'categorize':
      return sendCategorizeRequest();
    case 'sort':
      return sendSortRequest();
  }
};
