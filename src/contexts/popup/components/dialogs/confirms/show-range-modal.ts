import { renderRangeModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

interface Params {
  taskName: string;
  min: number;
  max: number;
}

export const showRangeModal = ({ taskName, min, max }: Params) => {
  openModal(taskName);

  return closeModalWhenGetAnswer(
    new Promise<number>((resolve) => {
      renderRangeModalContent({ taskName, min, max, resolve });
    }),
  );
};
