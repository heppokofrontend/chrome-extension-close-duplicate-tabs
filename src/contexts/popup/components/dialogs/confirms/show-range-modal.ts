import { renderRangeModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

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
