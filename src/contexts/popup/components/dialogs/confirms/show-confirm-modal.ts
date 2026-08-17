import { STATE } from '@/contexts/popup/state';

import { openModal } from './utils';

interface Params {
  message: string;
}

export const showConfirmModal = ({ message }: Params) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve('confirm');
  }

  return openModal(message, ['confirm', 'cancel']);
};
