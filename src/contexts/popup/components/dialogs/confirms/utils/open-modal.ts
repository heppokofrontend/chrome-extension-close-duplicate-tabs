import { buildButton } from '@/contexts/popup/components/dialogs/confirms/renderers';
import type { ActionCommand } from '@/contexts/popup/components/dialogs/types';
import { POPUP_UI } from '@/contexts/popup/constants';

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

let isOpen = false;

/** close-modal-when-get-answer が「本当に close イベントを待つべきか」を判定するために参照する。 */
export const isModalOpen = () => isOpen;

const handleClose = () => {
  isOpen = false;
  POPUP_UI.confirmModalText.textContent = '';
  POPUP_UI.confirmFormContainer.textContent = '';
  POPUP_UI.confirmDialogButtonContainer.textContent = '';
};

export function openModal(message: string, commands?: undefined): void;
export function openModal(message: string, commands: ActionCommand[]): Promise<ActionCommand>;
export function openModal(message: string, commands?: ActionCommand[]) {
  POPUP_UI.confirmModal.removeEventListener('close', handleClose);
  POPUP_UI.confirmModal.addEventListener('close', handleClose);
  POPUP_UI.confirmModalText.insertAdjacentHTML('afterbegin', message.replaceAll('\n', '<br>'));
  POPUP_UI.confirmModal.showModal();
  isOpen = true;

  if (commands === undefined) {
    return;
  }

  return closeModalWhenGetAnswer(renderButtonsAndWaitUserAnswer(commands));
}
