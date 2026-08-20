import type { AnswersOf, SelectField } from './renderers';
import { renderSelectModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

interface Params<F> {
  message: string;
  fields: F;
}

export const showSelectModal = <const F extends readonly SelectField<string>[]>({
  message,
  fields,
}: Params<F>) => {
  openModal(message);

  return closeModalWhenGetAnswer(
    new Promise<AnswersOf<F> | 'cancel'>((resolve) => {
      renderSelectModalContent({
        fields,
        resolve: (result) => {
          resolve(result === 'cancel' ? 'cancel' : result.answers);
        },
      });
    }),
  );
};
