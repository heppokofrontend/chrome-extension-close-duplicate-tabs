import { STATE, save } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
const formContainer = document.getElementById('confirm-controls') as HTMLDivElement;
const buttonContainer = document.getElementById('dialog-buttons') as HTMLElement;

confirmModal.ariaLabel = getMessage('dialog_confirm');

const useAbortController = (resolver: () => void) => {
  const controller = new AbortController();
  const { signal } = controller;

  const cleanUp = () => {
    signal.removeEventListener('abort', resolver);
    confirmModal.removeEventListener('close', onClose);
  };
  const onClose = () => {
    controller.abort();
    cleanUp();
  };

  confirmModal.addEventListener('close', onClose);
  signal.addEventListener('abort', resolver);

  return {
    cleanUp,
  };
};

const renderButtonsAndWaitUserAnswer = <T extends Command>(commands: readonly T[]) => {
  return new Promise<T>((resolve) => {
    const { cleanUp } = useAbortController(() => {
      resolve('cancel' as T);
    });

    commands.forEach((command) => {
      buttonContainer.appendChild(
        makeButton(command, () => {
          cleanUp();
          resolve(command);
        }),
      );
    });
  });
};

const handleClose = () => {
  confirmModalText.textContent = '';
  formContainer.textContent = '';
  buttonContainer.textContent = '';
};

function openModal(taskName: string): void;
function openModal(taskName: string, commands?: Command[]): Promise<Command>;
function openModal(taskName: string, commands?: Command[]) {
  const textContent = getMessage(`dialog_${taskName}`);

  confirmModal.removeEventListener('close', handleClose);
  confirmModal.addEventListener('close', handleClose);
  confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));
  confirmModal.showModal();

  if (commands === undefined) {
    return;
  }

  return closeModalWhenGetAnswer(renderButtonsAndWaitUserAnswer(commands));
}

const closeModalWhenGetAnswer = <V>(renderUIPromise: Promise<V>) =>
  renderUIPromise.finally(() => {
    confirmModal.close();
  });

type Command =
  | 'confirm'
  | 'cancel'
  | 'apply'
  | 'sortByUrl'
  | 'sortByTitle'
  | 'sortByHostAndTitle'
  | 'sortByLastAccessed'
  | 'show_duplicate';

const makeButton = (command: Command, onClick: () => void) => {
  const listItem = document.createElement('li');
  const button = document.createElement('button');

  button.type = 'button';
  button.textContent = getMessage(`dialog_command_${command}`);
  button.dataset['command'] = command;
  button.addEventListener('click', onClick);

  listItem.appendChild(button);
  return listItem;
};

export const showConfirmModal = ({ taskName }: { taskName: string }) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve('confirm');
  }

  return openModal(taskName, ['confirm', 'cancel']);
};

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: Command[];
}) => openModal(taskName, commands);

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
      const field = document.createElement('label');
      // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
      let value = STATE.saveData.minCategorizeNumber ?? min;

      field.className = 'textfield-label-in-dialog';
      field.insertAdjacentHTML(
        'afterbegin',
        `
        ${getMessage(`dialog_command_${taskName}_range1`, undefined, { allowEmpty: true })}
        <input type="number" min="${String(min)}" max="${String(max)}" value="${String(value)}" />
        ${getMessage(`dialog_command_${taskName}_range2`)}
      `,
      );
      field.querySelector('input')?.addEventListener('change', (e) => {
        if (e.target instanceof HTMLInputElement) {
          const valueAsNumber = e.target.valueAsNumber;
          const clamped = Number.isNaN(valueAsNumber)
            ? value
            : Math.min(max, Math.max(min, valueAsNumber));

          e.target.valueAsNumber = clamped;
          value = clamped;

          save({
            ...STATE.saveData,
            minCategorizeNumber: value,
          });
        }
      });
      formContainer.appendChild(field);

      const { cleanUp } = useAbortController(() => {
        resolve(Number.NaN);
      });

      buttonContainer.appendChild(
        makeButton('apply', () => {
          cleanUp();
          resolve(value);
        }),
      );

      buttonContainer.appendChild(
        makeButton('cancel', () => {
          cleanUp();
          resolve(Number.NaN);
        }),
      );
    }),
  );
};
