import {
  defaultSaveData,
  UPDATE_BADGE_MODES,
  type SaveDataType,
  type UpdateBadgeMode,
} from '@/utils/save-data';

export const isUpdateBadgeMode = (value: string): value is UpdateBadgeMode =>
  (UPDATE_BADGE_MODES as readonly string[]).includes(value);

export const isValidOptionType = (value: unknown): value is keyof SaveDataType => {
  if (typeof value !== 'string') {
    return false;
  }

  return value in defaultSaveData;
};
