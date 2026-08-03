import { STATE, save } from '@/contexts/popup/state';
import { type PathRule } from '@/utils';

const defaultRule: PathRule = { origin: '', pathname: false, query: false, hash: false };

export const patchRule = (key: string, patch: Partial<PathRule>) => {
  const current = STATE.saveData.advancedPathRules[key] ?? defaultRule;

  save({
    advancedPathRules: {
      ...STATE.saveData.advancedPathRules,
      [key]: { ...current, ...patch },
    },
  });
};
