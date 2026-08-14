export const TASK_NAMES = [
  'remove',
  'reload',
  'combine',
  'divide',
  'gather',
  'categorize',
  'sort',
] as const;

/** 「特定のホスト名のタブを集める」の集約先。 */
export const GATHER_DESTINATIONS = [
  //
  'currentWindow',
  'currentWindowGroup',
  'newWindow',
] as const;
