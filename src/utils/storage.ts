import type { TabWithIdAndUrl } from '@/types';

/**
 * 拡張機能アイコンのバッジに表示する数の種類。
 * - none: 表示しない
 * - all: 「重複タブをすべて閉じる」で閉じられるタブの総数
 * - current: カレントタブと URL が重複しているタブの数
 */
export const UPDATE_BADGE_MODES = ['none', 'all', 'current'] as const;
export type UpdateBadgeMode = (typeof UPDATE_BADGE_MODES)[number];

export type PathRule = {
  origin: string;
  pathname: boolean;
  query: boolean;
  hash: boolean;
  /** query 無視時にも比較対象として残す（無視しない）パラメータ名のカンマ区切り文字列。未入力なら query 全体を無視する。 */
  allowedQueryParams?: string;
};

/** 1つの入力欄あたりに保持する履歴の最大件数。 */
export const INPUT_HISTORY_MAX_ENTRIES = 5;

/** 入力履歴を管理する対象の入力欄を識別するキー。 */
interface InputHistoryMap {
  /** テキスト入力欄の入力履歴（新しい順、最大 INPUT_HISTORY_MAX_ENTRIES 件）。 */
  advancedPathRuleOrigin: string[];
}

export type InputHistoryKey = keyof InputHistoryMap;

export type SaveDataType = {
  ignorePathname?: boolean;
  ignoreQuery?: boolean;
  ignoreHash?: boolean;
  includeAllWindow?: boolean;
  includePinnedTabs?: boolean;
  includeGroupedTabs?: boolean;
  forcedChangeURLWhenClickedAnchorLink?: boolean;
  noConfirm?: boolean;
  minCategorizeNumber?: number;
  autoAvoidDuplicate?: boolean;
  updateBadgeMode?: UpdateBadgeMode;
  useAdvancedPathRule?: boolean;
  advancedPathRules?: Record<string, PathRule>;
  /** お知らせダイアログの表示済みキーと、表示した日時（ISO 8601 文字列）の記録。 */
  shown?: Record<string, string>;
  /** 各入力欄の入力履歴・直近値（キー = 入力欄の識別子）。 */
  inputHistory?: Partial<InputHistoryMap>;
};

export type UrlNormalizeOptions = Pick<
  SaveDataType,
  'ignorePathname' | 'ignoreQuery' | 'ignoreHash' | 'useAdvancedPathRule' | 'advancedPathRules'
>;

const mergeSaveData = <T extends object>(saved: unknown, defaults: T): T => {
  if (typeof saved !== 'object' || saved === null) {
    return { ...defaults };
  }

  return { ...defaults, ...(saved as Partial<T>) };
};

const isBooleanRecord = (value: unknown): value is Record<string, boolean> =>
  typeof value === 'object' &&
  value !== null &&
  Object.values(value).every((v) => typeof v === 'boolean');

export const defaultSaveData: Required<SaveDataType> = {
  ignorePathname: false,
  ignoreQuery: false,
  ignoreHash: true,
  includeAllWindow: false,
  includePinnedTabs: false,
  includeGroupedTabs: true,
  forcedChangeURLWhenClickedAnchorLink: false,
  noConfirm: false,
  minCategorizeNumber: 1,
  autoAvoidDuplicate: false,
  updateBadgeMode: 'none',
  useAdvancedPathRule: false,
  advancedPathRules: {
    google: {
      origin: 'https://www.google.com',
      pathname: false,
      query: true,
      hash: true,
      allowedQueryParams: 'q',
    },
    youtube: {
      origin: 'https://www.youtube.com',
      pathname: false,
      query: true,
      hash: true,
      allowedQueryParams: 'v',
    },
  },
  shown: {},
  inputHistory: {},
};

export function getLocalStorage(key: 'saveData'): Promise<Required<SaveDataType>>;
export function getLocalStorage(key: 'disclosureOpenStatus'): Promise<Record<string, boolean>>;
export function getLocalStorage(key: string): Promise<unknown>;
export async function getLocalStorage(key: string) {
  const result = await chrome.storage.local.get(key);

  if (key === 'saveData') {
    return mergeSaveData(result['saveData'], defaultSaveData);
  }

  if (key === 'disclosureOpenStatus') {
    // 1.6.3以降のユーザのみになったら削除する
    const oldTypoKey = 'dialogOpenStatus';
    const fallback = await chrome.storage.local.get(oldTypoKey);
    const resolvedFallback = isBooleanRecord(fallback[oldTypoKey]) ? fallback[oldTypoKey] : {};

    void chrome.storage.local.remove(oldTypoKey);
    void chrome.storage.local.remove('dangerZoneIsOpen');

    if (isBooleanRecord(result['disclosureOpenStatus'])) {
      return result['disclosureOpenStatus'];
    }

    await chrome.storage.local.set({ disclosureOpenStatus: resolvedFallback });

    return resolvedFallback;
  }

  return result[key];
}

const isDuplicateEntry = (entry: unknown): entry is [string, TabWithIdAndUrl[]] =>
  Array.isArray(entry) &&
  typeof entry[0] === 'string' &&
  Array.isArray(entry[1]) &&
  entry[1].every(
    (tab: unknown): tab is TabWithIdAndUrl =>
      typeof tab === 'object' &&
      tab !== null &&
      'id' in tab &&
      'url' in tab &&
      typeof tab.id === 'number' &&
      typeof tab.url === 'string',
  );

export function getSessionStorage(key: 'duplicatedEntries'): Promise<[string, TabWithIdAndUrl[]][]>;
export function getSessionStorage(key: 'lastWindowId'): Promise<number | null>;
export async function getSessionStorage(key: string) {
  const result = await chrome.storage.session.get(key);

  switch (key) {
    case 'duplicatedEntries':
      return Array.isArray(result['duplicatedEntries'])
        ? result['duplicatedEntries'].filter(isDuplicateEntry)
        : [];
    case 'lastWindowId': {
      const lastWindowId = result['lastWindowId'];

      if (typeof lastWindowId === 'number') {
        return Number.isNaN(lastWindowId) ? null : lastWindowId;
      }

      return null;
    }

    default:
      return result[key];
  }
}

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
