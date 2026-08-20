import type { ActionCommand } from '@/contexts/popup/components/dialogs/types';

import { openModal } from './utils';

interface Params {
  message: string;
  commands: ActionCommand[];
}

export const showChoicesModal = ({ message, commands }: Params) => openModal(message, commands);
