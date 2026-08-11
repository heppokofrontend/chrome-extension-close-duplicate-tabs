import { STATE, save } from '@/contexts/popup/state';
import { getMessage } from '@/utils';

const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
const buttonContainer = document.getElementById('dialog-buttons') as HTMLElement;

confirmModal.ariaLabel = getMessage('dialog_confirm');

const openModal = (taskName: string) => {
  const textContent = getMessage(`dialog_${taskName}`);

  confirmModalText.textContent = '';
  confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));

  confirmModal.showModal();
  confirmModal.focus();
};

const closeModalWhenDone = <V>(promise: Promise<V>) =>
  promise.finally(() => {
    buttonContainer.textContent = '';
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

const renderButtons = <T extends Command>(commands: readonly T[]) =>
  new Promise<T>((resolve) => {
    commands.forEach((command) => {
      buttonContainer.appendChild(
        makeButton(command, () => {
          resolve(command);
        }),
      );
    });
  });

export const showConfirmModal = ({ taskName }: { taskName: string }) => {
  if (STATE.saveData.noConfirm) {
    return Promise.resolve<'confirm' | 'cancel'>('confirm');
  }

  openModal(taskName);
  return closeModalWhenDone(renderButtons(['confirm', 'cancel']));
};

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: Command[];
}) => {
  openModal(taskName);
  return closeModalWhenDone(renderButtons(commands));
};

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

  return closeModalWhenDone(
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
      buttonContainer.appendChild(field);

      buttonContainer.appendChild(
        makeButton('apply', () => {
          resolve(value);
        }),
      );

      buttonContainer.appendChild(
        makeButton('cancel', () => {
          resolve(Number.NaN);
        }),
      );
    }),
  );
};
