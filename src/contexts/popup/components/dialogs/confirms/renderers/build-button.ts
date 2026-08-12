import type { Command } from '@/contexts/popup/components/dialogs/types';
import { getMessage } from '@/utils';

interface Props {
  command: Command;
  onClick: () => void;
}

export const buildButton = ({ command, onClick }: Props) => {
  const button = document.createElement('button');

  button.type = 'button';
  button.textContent = getMessage(`dialog_command_${command}`);
  button.dataset['command'] = command;
  button.addEventListener('click', onClick);

  return button;
};
