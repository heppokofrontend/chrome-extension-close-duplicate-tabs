import { STATE, save } from '@/popup/utils/state';
import { getMessage } from '@/utils';

const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
const buttonContainer = document.getElementById('dialog-buttons') as HTMLParagraphElement;
const templateButton = document.createElement('button');

templateButton.type = 'button';
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

const makeButton = (messageKey: string, onClick: () => void) => {
  const button = templateButton.cloneNode();

  button.textContent = getMessage(messageKey);
  button.addEventListener('click', onClick);

  return button;
};

const renderButtons = <T extends string>(commands: readonly T[]) =>
  new Promise<T>((resolve) => {
    commands.forEach((command) => {
      buttonContainer.appendChild(
        makeButton(`dialog_command_${command}`, () => {
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
  return closeModalWhenDone(renderButtons(['confirm', 'cancel'] as const));
};

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: string[];
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
        ${getMessage(`dialog_command_${taskName}_range1`)}
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
        makeButton('dialog_command_apply', () => {
          resolve(value);
        }),
      );

      buttonContainer.appendChild(
        makeButton('dialog_command_cancel', () => {
          resolve(Number.NaN);
        }),
      );
    }),
  );
};
