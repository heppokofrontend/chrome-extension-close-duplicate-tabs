import type { Command } from '@/contexts/popup/components/dialogs/types';

import { openModal } from './utils';

export const showChoicesModal = ({
  taskName,
  commands,
}: {
  taskName: string;
  commands: Command[];
}) => openModal(taskName, commands);
