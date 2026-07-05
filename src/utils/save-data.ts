export type SaveDataType = {
  ignorePathname?: boolean;
  ignoreQuery?: boolean;
  ignoreHash?: boolean;
  includeAllWindow?: boolean;
  includePinnedTabs?: boolean;
  forcedChangeURLWhenClickedAnchorLink?: boolean;
  noConfirm?: boolean;
  minCategorizeNumber?: number;
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
};

export const getSaveData = async () => {
  const { saveData } = await chrome.storage.local.get('saveData');

  return mergeSaveData(saveData, defaultSaveData);
};
