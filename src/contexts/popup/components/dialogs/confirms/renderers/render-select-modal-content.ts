import { useAbortController } from '@/contexts/popup/components/dialogs/confirms/utils';
import { POPUP_UI } from '@/contexts/popup/constants';

import { buildButton } from './build-button';
import { buildSelectField } from './build-select-field';

export type SelectField<K extends string, V extends string = string> = {
  key: K;
  options: { value: V; label: string }[];
};

/** fields のタプルから、key ごとの選択肢値の型を保ったまま answers の型を組み立てる。 */
export type AnswersOf<F extends readonly SelectField<string>[]> = {
  [FIELD in F[number] as FIELD['key']]: FIELD extends SelectField<string, infer V> ? V : never;
};

export const renderSelectModalContent = <F extends readonly SelectField<string>[]>({
  fields,
  resolve,
}: {
  fields: readonly (SelectField<F[number]['key']> & { label: string })[];
  resolve: (result: { answers: AnswersOf<F> } | 'cancel') => void;
}) => {
  const getters = fields.map(({ key, label, options }) => {
    const { element, getValue } = buildSelectField({ label, options });

    POPUP_UI.confirmFormContainer.append(element);

    return { key, getValue };
  });

  const { cleanUp } = useAbortController(() => {
    resolve('cancel');
  });

  const applyButton = buildButton({
    command: 'apply',
    onClick: () => {
      const values = getters.map(({ key, getValue }) => [key, getValue()]);

      if (values.some(([, value]) => value === '')) {
        return undefined;
      }

      const answers = Object.fromEntries(values) as AnswersOf<F>;

      cleanUp();
      resolve({ answers });
    },
  });

  const cancelButton = buildButton({
    command: 'cancel',
    onClick: () => {
      cleanUp();
      resolve('cancel');
    },
  });

  [applyButton, cancelButton].forEach((button) => {
    const li = document.createElement('li');

    li.appendChild(button);
    POPUP_UI.confirmDialogButtonContainer.appendChild(li);
  });
};
