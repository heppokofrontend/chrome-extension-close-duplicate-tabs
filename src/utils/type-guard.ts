import { taskNames, type TaskName } from '@/types';
import {
  defaultSaveData,
  UPDATE_BADGE_MODES,
  type SaveDataType,
  type UpdateBadgeMode,
} from '@/utils/save-data';
import { sortTypes, type SortType } from '@/worker/features/sort';

export const isUpdateBadgeMode = (value: string): value is UpdateBadgeMode =>
  (UPDATE_BADGE_MODES as readonly string[]).includes(value);

export const isValidOptionType = (value: unknown): value is keyof SaveDataType => {
  if (typeof value !== 'string') {
    return false;
  }

  return value in defaultSaveData;
};

export const isValidSortType = (value: unknown): value is SortType => {
  return typeof value === 'string' && (sortTypes as readonly string[]).includes(value);
};

export const isValidTaskName = (value: unknown): value is TaskName => {
  return typeof value === 'string' && (taskNames as readonly string[]).includes(value);
};
