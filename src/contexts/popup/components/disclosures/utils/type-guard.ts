import { DETAILS_OPEN_STATUS_KEYS, type DetailsOpenStatusKey } from '@/contexts/popup/state';

export const isDetailsOpenStatusKey = (id: string): id is DetailsOpenStatusKey =>
  id in DETAILS_OPEN_STATUS_KEYS;
