import { buildButton } from '@/contexts/popup/components/dialogs/renderers';
import type { Command } from '@/contexts/popup/components/dialogs/types';
import { UI } from '@/contexts/popup/constants';
import { getMessage } from '@/utils';

import { closeModalWhenGetAnswer } from './close-modal-when-get-answer';
import { useAbortController } from './use-abort-controller';

const renderButtonsAndWaitUserAnswer = <T extends Command>(commands: readonly T[]) => {
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
      UI.confirmDialogButtonContainer.appendChild(li);
    });
  });
};

const handleClose = () => {
  UI.confirmModalText.textContent = '';
  UI.confirmFormContainer.textContent = '';
  UI.confirmDialogButtonContainer.textContent = '';
};

export function openModal(taskName: string): void;
export function openModal(taskName: string, commands?: Command[]): Promise<Command>;
export function openModal(taskName: string, commands?: Command[]) {
  const textContent = getMessage(`dialog_${taskName}`);

  UI.confirmModal.removeEventListener('close', handleClose);
  UI.confirmModal.addEventListener('close', handleClose);
  UI.confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));
  UI.confirmModal.showModal();

  if (commands === undefined) {
    return;
  }

  return closeModalWhenGetAnswer(renderButtonsAndWaitUserAnswer(commands));
}
