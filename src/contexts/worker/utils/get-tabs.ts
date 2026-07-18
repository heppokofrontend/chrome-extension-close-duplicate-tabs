import type { SaveDataType } from '@/utils';

export const getCurrentTab = async () => {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!currentTab) {
    throw new Error('No active tab found in the current window.');
  }

  return currentTab;
};

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

export const getAllTabs = async (windowId: number | undefined): Promise<chrome.tabs.Tab[]> => {
  const query =
    windowId === undefined
      ? ({ windowType: 'normal' } as const)
      : ({ windowType: 'normal', windowId } as const);

  return chrome.tabs.query(query);
};
