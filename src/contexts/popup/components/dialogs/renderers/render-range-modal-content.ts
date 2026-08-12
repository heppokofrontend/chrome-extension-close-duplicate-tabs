import { useAbortController } from '@/contexts/popup/components/dialogs/utils';
import { POPUP_UI } from '@/contexts/popup/constants';

import { buildButton } from './build-button';
import { buildRangeField } from './build-range-field';

interface Props {
  taskName: string;
  min: number;
  max: number;
  resolve: (result: number) => void;
}

export const renderRangeModalContent = ({ taskName, min, max, resolve }: Props) => {
  const { element, getValue } = buildRangeField({ taskName, min, max });

  POPUP_UI.confirmFormContainer.append(element);

  const { cleanUp } = useAbortController(() => {
    resolve(Number.NaN);
  });

  const applyButton = buildButton({
    command: 'apply',
    onClick: () => {
      cleanUp();
      resolve(getValue());
    },
  });

  const cancelButton = buildButton({
    command: 'cancel',
    onClick: () => {
      cleanUp();
      resolve(Number.NaN);
    },
  });

  [applyButton, cancelButton].forEach((button) => {
    const li = document.createElement('li');

    li.appendChild(button);
    POPUP_UI.confirmDialogButtonContainer.appendChild(li);
  });
};
