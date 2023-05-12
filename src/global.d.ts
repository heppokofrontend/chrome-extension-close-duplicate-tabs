type SaveDataType = {
  ignorePathname?: boolean;
  ignoreQuery?: boolean;
  ignoreHash?: boolean;
  includeAllWindow?: boolean;
  includePinnedTabs?: boolean;
  noConfirm?: boolean;
  minCategorizeNumber?: number;
};
type SortType = 'sortByUrl' | 'sortByTitle' | 'sortByHostAndTitle' | 'false';
