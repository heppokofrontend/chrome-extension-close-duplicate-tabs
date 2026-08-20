import { getMessage } from '@/utils';

import { renderRangeModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

interface Params {
  taskName: string;
}

export const showCategorizeModal = ({ taskName }: Params) => {
  openModal(getMessage(`dialog_${taskName}`));

  return closeModalWhenGetAnswer(
    new Promise<number>((resolve) => {
      renderRangeModalContent({ taskName, resolve });
    }),
  );
};
