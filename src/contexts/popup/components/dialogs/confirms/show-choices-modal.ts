import type { ActionCommand } from '@/contexts/popup/components/dialogs/types';

import { openModal } from './utils';

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: ActionCommand[];
}) => openModal(taskName, commands);
