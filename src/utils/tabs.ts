import type { SaveDataType } from './storage';

type Params = Pick<SaveDataType, 'includeAllWindow' | 'includePinnedTabs' | 'includeGroupedTabs'>;

export const isInTabGroup = (groupId: number | undefined) =>
  groupId !== undefined && groupId !== chrome.tabGroups.TAB_GROUP_ID_NONE;

export const getTabs = async ({
  includeAllWindow,
  includePinnedTabs,
  includeGroupedTabs,
}: Params): Promise<chrome.tabs.Tab[]> => {
  const currentWindow = includeAllWindow ? undefined : true;
  const pinned = includePinnedTabs ? undefined : false;

  const tabs = await chrome.tabs.query({
    windowType: 'normal',
    currentWindow,
    pinned,
  });

  if (includeGroupedTabs === false) {
    return tabs.filter((tab) => !isInTabGroup(tab.groupId));
  }

  return tabs;
};
