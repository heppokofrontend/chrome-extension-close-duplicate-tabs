import type { SaveDataType } from './storage';

export const getTabs = async ({
  includeAllWindow,
  includePinnedTabs,
}: Pick<SaveDataType, 'includeAllWindow' | 'includePinnedTabs'>): Promise<chrome.tabs.Tab[]> => {
  const currentWindow = includeAllWindow ? undefined : true;
  const pinned = includePinnedTabs ? undefined : false;

  return await chrome.tabs.query({
    windowType: 'normal',
    currentWindow,
    pinned,
  });
};
