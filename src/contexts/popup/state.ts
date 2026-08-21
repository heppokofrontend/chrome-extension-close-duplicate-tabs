import { type SaveDataType, defaultSaveData, getMessage, setSaveData } from '@/utils';

export const DETAILS_OPEN_STATUS_KEYS = {
  dangerZoneDetails: 'dangerZone',
  advancedPathRulesDetails: 'advancedPathRules',
} as const;

export type DetailsOpenStatusKey = keyof typeof DETAILS_OPEN_STATUS_KEYS;

export const STATE = {
  disclosureOpenStatus: {
    dangerZone: false,
    advancedPathRules: false,
  },
  saveData: defaultSaveData,
  /** Advanced Path Rule の origin 入力欄に placeholder として表示する、現在アクティブなタブの origin。取得不可時は null。 */
  currentTabOrigin: null as string | null,
  /** 編集開始時に編集前の origin の値を保持しておくためのフィールド。 */
  editingOriginBeforeValue: '',
};

/**
 * 既存の保存データにパッチを重ねた新しい値を返す純粋関数。
 * shown は表示済みキーを積み上げる記録なので、丸ごと置き換えず既存キーを残す。
 */
const applySaveDataPatch = (
  base: Required<SaveDataType>,
  patch: Partial<SaveDataType>,
): Required<SaveDataType> => ({
  ...base,
  ...patch,
  shown: {
    ...base.shown,
    ...patch.shown,
  },
  inputHistory: {
    ...base.inputHistory,
    ...patch.inputHistory,
  },
});

export const save = (patch: Partial<SaveDataType>) => {
  const previous = STATE.saveData;

  STATE.saveData = applySaveDataPatch(previous, patch);
  setSaveData(STATE.saveData).catch((error: unknown) => {
    // 失敗した書き込みの内容で STATE が storage と食い違ったままにならないよう、
    // 書き込み前の値へ巻き戻したうえでユーザーにも知らせる。
    STATE.saveData = previous;
    console.error(error);
    window.alert(getMessage('error_saveFailed'));
  });
};
