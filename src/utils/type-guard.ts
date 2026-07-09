import { UPDATE_BADGE_MODES, type UpdateBadgeMode } from '@/utils/save-data';

export const isUpdateBadgeMode = (value: string): value is UpdateBadgeMode =>
  (UPDATE_BADGE_MODES as readonly string[]).includes(value);
