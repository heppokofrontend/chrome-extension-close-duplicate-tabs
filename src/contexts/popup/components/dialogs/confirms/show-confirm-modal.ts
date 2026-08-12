import { STATE } from '@/contexts/popup/state';

import { openModal } from './utils';

export const showConfirmModal = ({ taskName }: { taskName: string }) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve('confirm');
  }

  return openModal(taskName, ['confirm', 'cancel']);
};
