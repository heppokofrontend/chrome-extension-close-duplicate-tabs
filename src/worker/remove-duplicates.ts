import type { SaveDataType } from '../constants';
import { getUrl } from '../utils/url';
import { getCurrentTab } from './utils';

interface DuplicateCandidateTab {
  id: number;
  url?: string | undefined;
  windowId: number;
}

export const pickTabIdsToClose = ({
  candidateTabs,
  currentTabId,
  currentUrl,
  currentWindowId,
  includeAllWindow,
}: {
  candidateTabs: DuplicateCandidateTab[];
  currentTabId: number | undefined;
  currentUrl: string | null;
  currentWindowId: number | undefined;
  includeAllWindow: boolean | undefined;
}): number[] => {
  const checkedUrl = new Set<string>();
  const tabList = [...candidateTabs];

  if (currentWindowId && includeAllWindow) {
    tabList.sort((a, b) => {
      if (a.windowId === currentWindowId && b.windowId !== currentWindowId) {
        return -1;
      }

      if (a.windowId !== currentWindowId && b.windowId === currentWindowId) {
        return 1;
      }

      return 0;
    });
  }

  // カレントタブは常に「残す側」にするため先に checkedUrl へ登録する。
  if (currentUrl) {
    checkedUrl.add(currentUrl);
  }

  return tabList
    .filter((tab): tab is DuplicateCandidateTab & { url: string } => {
      const { id, url } = tab;

      if (url === undefined || currentTabId === id) {
        return false;
      }

      if (checkedUrl.has(url)) {
        return true;
      }

      checkedUrl.add(url);
      return false;
    })
    .map(({ id }) => id);
};

let duplicatedListWindow: chrome.windows.Window | null = null;

export const removeDuplicatedTabs = async (
  tabs: chrome.tabs.Tab[],
  options: SaveDataType & { shouldShowDuplicatePage?: boolean },
) => {
  const urlBaseTabList: Record<string, chrome.tabs.Tab[]> = {};

  for (const tab of tabs) {
    const { id } = tab;
    const url = getUrl(tab.url, options);

    if (!url || typeof id !== 'number') {
      continue;
    }

    urlBaseTabList[url] ??= [];
    urlBaseTabList[url].push(tab);
  }

  const currentTab = await getCurrentTab();
  const duplicatedEntries = Object.entries(urlBaseTabList).filter(([, { length }]) => {
    return 2 <= length;
  });

  if (options.shouldShowDuplicatePage === true) {
    void chrome.storage.session.set({ lastWindowId: currentTab.windowId, duplicatedEntries });
    chrome.windows.get(duplicatedListWindow?.id ?? 0, () => {
      if (chrome.runtime.lastError) {
        void (async () => {
          duplicatedListWindow =
            (await chrome.windows.create({
              url: 'duplicates-list.html',
              type: 'popup',
              width: 800,
              height: 800,
              left: 100,
              top: 100,
            })) ?? null;
        })();

        return;
      }

      const targetWindowId = duplicatedListWindow?.id;

      if (typeof targetWindowId !== 'number') {
        return;
      }

      chrome.windows.update(targetWindowId, { focused: true, state: 'normal' }, () => {
        const tab = duplicatedListWindow?.tabs?.[0];
        if (typeof tab?.id === 'number') {
          void chrome.tabs.reload(tab.id, { bypassCache: false });
        }
      });
    });

    return;
  }

  const currentUrl = getUrl(currentTab.url, options);
  const candidateTabs = duplicatedEntries
    .flatMap(([, tabItems]) => tabItems)
    .filter((tab): tab is chrome.tabs.Tab & { id: number } => typeof tab.id === 'number');

  const targetTabIdList = pickTabIdsToClose({
    candidateTabs,
    currentTabId: currentTab.id,
    currentUrl,
    currentWindowId: currentTab.windowId,
    includeAllWindow: options.includeAllWindow,
  });

  for (const id of targetTabIdList) {
    void chrome.tabs.remove(id);
  }
};
