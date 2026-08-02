import { runTask } from '@/contexts/popup/features';
import { isValidTaskName } from '@/utils/type-guard';

export const onRunButtonClick = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLButtonElement)) {
    return;
  }

  const taskName = e.currentTarget.dataset['taskName'];

  if (isValidTaskName(taskName)) {
    void runTask(taskName);
  }
};
