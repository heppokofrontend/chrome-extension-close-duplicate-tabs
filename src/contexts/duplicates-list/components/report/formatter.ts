import { getMessage } from '@/utils';

const SECOND_MS = 1_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

export const formatLastAccessed = (lastAccessed: number, now = Date.now()) => {
  const diffMs = Math.max(0, now - lastAccessed);

  if (diffMs < MINUTE_MS) {
    return getMessage('duplicates_last_accessed_seconds', String(Math.floor(diffMs / SECOND_MS)));
  }

  if (diffMs < HOUR_MS) {
    return getMessage('duplicates_last_accessed_minutes', String(Math.floor(diffMs / MINUTE_MS)));
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);

    return getMessage('duplicates_last_accessed_hours', [String(hours), String(minutes)]);
  }

  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);

  return getMessage('duplicates_last_accessed_days', [String(days), String(hours)]);
};
