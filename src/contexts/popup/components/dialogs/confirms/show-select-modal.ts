import { getMessage } from '@/utils';

import type { AnswersOf, SelectField } from './renderers';
import { renderSelectModalContent } from './renderers';
import { closeModalWhenGetAnswer, openModal } from './utils';

export const showSelectModal = <const F extends readonly SelectField<string>[]>(params: {
  taskName: string;
  fields: F;
}) => {
  openModal(params.taskName);

  const fields = params.fields.map(({ key, options }) => ({
    key,
    label: getMessage(`dialog_command_${params.taskName}_select_${key}`, {
      allowEmpty: true,
    }),
    options,
  }));

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
