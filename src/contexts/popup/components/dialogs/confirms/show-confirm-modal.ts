import { STATE } from '@/contexts/popup/state';

import { openModal } from './utils';

interface Params {
  taskName: string;
}

export const showConfirmModal = ({ taskName }: Params) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve('confirm');
  }

  return openModal(taskName, ['confirm', 'cancel']);
};
