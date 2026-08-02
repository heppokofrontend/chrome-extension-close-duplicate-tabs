import { STATE } from '@/contexts/popup/state';
import { normalizeOrigin, type InputHistoryKey } from '@/utils';

/** 1つの入力欄あたりに保持する履歴の最大件数。 */
export const INPUT_HISTORY_MAX_ENTRIES = 5;

/**
 * 空文字列は履歴に追加しない（null を返す）。既存の同じ値は取り除いてから
 * 先頭に追加し直す（重複除去 + 最新を先頭に）。
 */
export const createInputHistoryPatch = ({
  key,
  value,
}: {
  key: InputHistoryKey;
  value: string;
}): Partial<Record<InputHistoryKey, string[]>> | null => {
  const currentEntries = STATE.saveData.inputHistory[key];

  const trimmed = value.trim();

  if (!trimmed) {
    return null;
  }

  const next = [trimmed, ...(currentEntries ?? []).filter((entry) => entry !== trimmed)]
    .filter((origin) => {
      return normalizeOrigin(origin) !== null;
    })
    .slice(0, INPUT_HISTORY_MAX_ENTRIES);

  return { [key]: next };
};
