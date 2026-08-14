import { buildButton } from '@/contexts/popup/components/dialogs/confirms/renderers';
import type { ActionCommand } from '@/contexts/popup/components/dialogs/types';
import { POPUP_UI } from '@/contexts/popup/constants';
import { getMessage } from '@/utils';

import { closeModalWhenGetAnswer } from './close-modal-when-get-answer';
import { useAbortController } from './use-abort-controller';

const renderButtonsAndWaitUserAnswer = <T extends ActionCommand>(commands: readonly T[]) => {
  return new Promise<T>((resolve) => {
    const { cleanUp } = useAbortController(() => {
      resolve('cancel' as T);
    });

    commands.forEach((command) => {
      const button = buildButton({
        command,
        onClick: () => {
          cleanUp();
          resolve(command);
        },
      });
      const li = document.createElement('li');

      li.appendChild(button);
      POPUP_UI.confirmDialogButtonContainer.appendChild(li);
    });
  });
};

const handleClose = () => {
  POPUP_UI.confirmModalText.textContent = '';
  POPUP_UI.confirmFormContainer.textContent = '';
  POPUP_UI.confirmDialogButtonContainer.textContent = '';
};

export function openModal(taskName: string): void;
export function openModal(taskName: string, commands?: ActionCommand[]): Promise<ActionCommand>;
export function openModal(taskName: string, commands?: ActionCommand[]) {
  const textContent = getMessage(`dialog_${taskName}`);

  POPUP_UI.confirmModal.removeEventListener('close', handleClose);
  POPUP_UI.confirmModal.addEventListener('close', handleClose);
  POPUP_UI.confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));
  POPUP_UI.confirmModal.showModal();

  if (commands === undefined) {
    return;
  }

  return closeModalWhenGetAnswer(renderButtonsAndWaitUserAnswer(commands));
}
