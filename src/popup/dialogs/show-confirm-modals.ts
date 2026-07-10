import { STATE, save } from '@/popup/state';

const getMessage = (key: string) => chrome.i18n.getMessage(key);

type Commands<T> = T[];
type Options<T> =
  | {
      type: 'remove';
      commands: Commands<T>;
    }
  | {
      type: 'multiple';
      commands: Commands<T>;
    }
  | {
      type: 'range';
      range: number[];
    };

const confirmModal = document.getElementById('confirm') as HTMLDialogElement;
const confirmModalText = document.getElementById('confirm-text') as HTMLParagraphElement;
const buttonContainer = document.getElementById('dialog-buttons') as HTMLParagraphElement;
const templateButton = document.createElement('button');
const defaultCommands = ['confirm', 'cancel'];

templateButton.type = 'button';
confirmModal.ariaLabel = getMessage('dialog_confirm');

export const showConfirmModal = <T = 'confirm' | 'cancel'>(
  taskName: string,
  options?: Options<T>,
) => {
  const textContent = getMessage(`dialog_${taskName}`);

  confirmModalText.textContent = '';
  confirmModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));

  confirmModal.showModal();
  confirmModal.focus();

  const renderButtons = ({
    resolve,
    commands,
  }: {
    resolve: (value: T | 'cancel') => void;
    commands: Commands<T>;
  }) => {
    commands.forEach((command) => {
      const button = templateButton.cloneNode();

      button.textContent = getMessage(`dialog_command_${String(command)}`);
      button.addEventListener('click', () => {
        resolve(command);
      });

      buttonContainer.appendChild(button);
    });
  };

  return new Promise<T | 'cancel'>((resolve) => {
    switch (options?.type) {
      case 'range': {
        // FIXME: Type assertion
        const field = document.createElement('label');
        const min = options.range[0] ?? 0;
        const max = options.range.at(-1) ?? min;
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

        const okButton = templateButton.cloneNode();

        okButton.textContent = getMessage(`dialog_command_apply`);
        okButton.addEventListener('click', () => {
          resolve(value as T);
        });

        buttonContainer.appendChild(okButton);

        const cancelButton = templateButton.cloneNode();

        cancelButton.textContent = getMessage(`dialog_command_false`);
        cancelButton.addEventListener('click', () => {
          resolve('cancel');
        });

        buttonContainer.appendChild(cancelButton);

        break;
      }

      default: {
        renderButtons({
          resolve,
          commands: options?.commands ?? (defaultCommands as Commands<T>),
        });

        break;
      }
    }
  }).finally(() => {
    buttonContainer.textContent = '';
    confirmModal.close();
  });
};
