import { GATHER_DESTINATIONS } from '@/constants';
import {
  showChoicesModal,
  showNoticeModal,
  showSelectModal,
} from '@/contexts/popup/components/dialogs';
import { STATE } from '@/contexts/popup/state';
import type { GatherScope } from '@/types';
import { getMessage, getTabs } from '@/utils';

import { sendTaskRequest } from './utils/send-task-request';

const FROM_CURRENT_WINDOW = 'gatherFromCurrentWindow';
const FROM_ALL_WINDOWS = 'gatherFromAllWindows';

/** includeAllWindow が無効なときだけ、対象範囲（このウィンドウ／全ウィンドウ）を選択。 */
const resolveScope = async (taskName: string): Promise<GatherScope | 'cancel'> => {
  if (STATE.saveData.includeAllWindow) {
    return 'allWindows';
  }

  const command = await showChoicesModal({
    taskName: `${taskName}_all`,
    commands: [FROM_CURRENT_WINDOW, FROM_ALL_WINDOWS, 'cancel'],
  });

  if (command === FROM_CURRENT_WINDOW) {
    return 'currentWindow';
  }

  if (command === FROM_ALL_WINDOWS) {
    return 'allWindows';
  }

  return 'cancel';
};

/** scope に応じたタブを対象に、開いているタブのoriginをアルファベット順・重複なく列挙する。 */
const getOrigins = async (scope: GatherScope) => {
  const tabs = await getTabs({
    includeAllWindow: scope === 'allWindows',
    includePinnedTabs: STATE.saveData.includePinnedTabs,
    includeGroupedTabs: STATE.saveData.includeGroupedTabs,
  });
  const origins = new Set<string>();

  for (const { url } of tabs) {
    if (url === undefined || url === '') {
      continue;
    }

    try {
      const { origin, protocol } = new URL(url);

      if (origin === 'null') {
        origins.add(`${protocol}*`);
      } else if (origin) {
        origins.add(origin);
      }
    } catch {
      continue;
    }
  }

  return [...origins].sort((a, b) => a.localeCompare(b));
};

/** 特定のoriginのタブを集める */
export const sendGatherRequest = async () => {
  const taskName = 'gather';
  const scope = await resolveScope(taskName);

  if (scope === 'cancel') {
    return;
  }

  const origins = await getOrigins(scope);

  if (origins.length === 0) {
    showNoticeModal({ message: getMessage('dialog_gather_empty') });
    return;
  }

  const result = await showSelectModal({
    taskName,
    fields: [
      {
        key: 'origin',
        options: origins.map((origin) => ({
          label: origin,
          value: origin,
        })),
      },
      {
        key: 'destination',
        options: GATHER_DESTINATIONS.map((destination) => ({
          label: getMessage(`dialog_command_${destination}`),
          value: destination,
        })),
      },
    ],
  });

  if (result === 'cancel') {
    return;
  }

  const { origin, destination } = result;

  sendTaskRequest({
    taskName,
    origin,
    gatherScope: scope,
    gatherDestination: destination,
  });
};
