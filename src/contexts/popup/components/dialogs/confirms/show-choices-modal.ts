import type { ActionCommand } from '@/contexts/popup/components/dialogs/types';

import { openModal } from './utils';

interface Params {
  taskName: string;
  commands: ActionCommand[];
}

export const showChoicesModal = ({ taskName, commands }: Params) => openModal(taskName, commands);
