import { getMessage } from '@/utils';

import { renderRangeModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

interface Params {
  taskName: string;
  min: number;
  max: number;
}

export const showCategorizeModal = ({ taskName, min, max }: Params) => {
  openModal(getMessage(`dialog_${taskName}`));

  return closeModalWhenGetAnswer(
    new Promise<number>((resolve) => {
      renderRangeModalContent({ taskName, min, max, resolve });
    }),
  );
};
