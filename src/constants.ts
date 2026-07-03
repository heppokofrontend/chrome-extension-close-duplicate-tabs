export type SaveDataType = {
  ignorePathname?: boolean;
  ignoreQuery?: boolean;
  ignoreHash?: boolean;
  includeAllWindow?: boolean;
  includePinnedTabs?: boolean;
  foucedChangeURLWhenClickedAnchorLink?: boolean;
  noConfirm?: boolean;
  minCategorizeNumber?: number;
};

export type SortType = 'sortByUrl' | 'sortByTitle' | 'sortByHostAndTitle' | 'false';

export const defaultSaveData: Required<SaveDataType> = {
  ignorePathname: false,
  ignoreQuery: false,
  ignoreHash: true,
  includeAllWindow: false,
  includePinnedTabs: false,
  foucedChangeURLWhenClickedAnchorLink: false,
  noConfirm: false,
  minCategorizeNumber: 1,
};
