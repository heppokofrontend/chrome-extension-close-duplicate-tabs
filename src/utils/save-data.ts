/**
 * 拡張機能アイコンのバッジに表示する数の種類。
 * - none: 表示しない
 * - all: 「重複タブをすべて閉じる」で閉じられるタブの総数
 * - current: カレントタブと URL が重複しているタブの数
 */
export const UPDATE_BADGE_MODES = ['none', 'all', 'current'] as const;
export type UpdateBadgeMode = (typeof UPDATE_BADGE_MODES)[number];

export type SaveDataType = {
  ignorePathname?: boolean;
  ignoreQuery?: boolean;
  ignoreHash?: boolean;
  includeAllWindow?: boolean;
  includePinnedTabs?: boolean;
  forcedChangeURLWhenClickedAnchorLink?: boolean;
  noConfirm?: boolean;
  minCategorizeNumber?: number;
  autoAvoidDuplicate?: boolean;
  updateBadgeMode?: UpdateBadgeMode;
  /** お知らせダイアログの表示済みキーと、表示した日時（ISO 8601 文字列）の記録。 */
  shown?: Record<string, string>;
};

export type UrlNormalizeOptions = Pick<
  SaveDataType,
  'ignorePathname' | 'ignoreQuery' | 'ignoreHash'
>;

const mergeSaveData = <T extends object>(saved: unknown, defaults: T): T => {
  if (typeof saved !== 'object' || saved === null) {
    return { ...defaults };
  }

  return { ...defaults, ...(saved as Partial<T>) };
};

export const defaultSaveData: Required<SaveDataType> = {
  ignorePathname: false,
  ignoreQuery: false,
  ignoreHash: true,
  includeAllWindow: false,
  includePinnedTabs: false,
  forcedChangeURLWhenClickedAnchorLink: false,
  noConfirm: false,
  minCategorizeNumber: 1,
  autoAvoidDuplicate: false,
  updateBadgeMode: 'none',
  shown: {},
};

export const getSaveData = async () => {
  const { saveData } = await chrome.storage.local.get('saveData');

  return mergeSaveData(saveData, defaultSaveData);
};

/**
 * 既存の保存データにパッチを重ねた新しい値を返す純粋関数。
 * shown は表示済みキーを積み上げる記録なので、丸ごと置き換えず既存キーを残す。
 */
export const applySaveDataPatch = (
  base: Required<SaveDataType>,
  patch: Partial<SaveDataType>,
): Required<SaveDataType> => ({
  ...base,
  ...patch,
  shown: {
    ...base.shown,
    ...patch.shown,
  },
});

/**
 * 直前の書き込みが完了してから次の set を走らせるための順序保証キュー。
 * 呼び出し順どおりに storage へ到達させ、後発の書き込みが先発に飲まれないようにする。
 * 失敗した書き込みで後続が止まらないよう、キュー側では rejection を握り潰す
 * （呼び出し側へ返す Promise は reject するので、失敗処理は呼び出し側で行う）。
 */
let inflight: Promise<unknown> = Promise.resolve();

/**
 * 保存データを storage へ全量上書きで書き込む（マージはしない）。
 *
 * 前提：saveData の書き込み手は popup のみ。複数コンテキストから書く構成に変わる場合、
 * 全量上書きは他コンテキストの書き込みを巻き戻すため、この設計を見直すこと。
 * inflight による直列化が効くのも同一 JS コンテキスト内のみ。
 */
export const setSaveData = (saveData: Required<SaveDataType>) => {
  const next = inflight.then(() => chrome.storage.local.set({ saveData }));

  inflight = next.catch(() => undefined);

  return next;
};
