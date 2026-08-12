import { STATE } from '@/contexts/popup/state';

import { renderRangeModalContent } from './renderers';
import type { Command } from './types';
import { closeModalWhenGetAnswer, openModal } from './utils';

export const showConfirmModal = ({ taskName }: { taskName: string }) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve('confirm');
  }

  return openModal(taskName, ['confirm', 'cancel']);
};

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: Command[];
}) => openModal(taskName, commands);

export const showRangeModal = ({
  taskName,
  min,
  max,
}: {
  taskName: string;
  min: number;
  max: number;
}) => {
  openModal(taskName);

  return closeModalWhenGetAnswer(
    new Promise<number>((resolve) => {
      renderRangeModalContent({ taskName, min, max, resolve });
    }),
  );
};
