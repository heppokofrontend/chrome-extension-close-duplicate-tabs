import { normalizeUrl, type NormalizedUrl, type SaveDataType } from '@/utils';
import { getCurrentTab, getGroupedTabsByNormalizedUrl } from '@/worker/utils';

interface DuplicateCandidateTab {
  id: number;
  url?: NormalizedUrl;
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
  currentUrl: NormalizedUrl | null;
  currentWindowId: number | undefined;
  includeAllWindow: boolean | undefined;
}): number[] => {
  const checkedUrl = new Set<NormalizedUrl>();
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
    .filter((tab): tab is DuplicateCandidateTab & { url: NormalizedUrl } => {
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

/** 重複したタブを閉じる */
export const removeDuplicatedTabs = async (
  tabs: chrome.tabs.Tab[],
  options: SaveDataType & { shouldShowDuplicatePage?: boolean },
) => {
  const groupedTabs = getGroupedTabsByNormalizedUrl(tabs, options);
  const currentTab = await getCurrentTab();
  const duplicatedEntries = [...groupedTabs].filter(([, { length }]) => 2 <= length);

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

  const currentUrl = normalizeUrl(currentTab.url, options);
  // pickTabIdsToClose は url の同一性で「残す/閉じる」を決めるため、
  // グループ化キー（正規化 URL）を各タブの url に流し込んでおく。
  const candidateTabs = duplicatedEntries.flatMap(([normalizedUrl, tabItems]) =>
    tabItems
      .filter((tab): tab is chrome.tabs.Tab & { id: number } => typeof tab.id === 'number')
      .map(({ id, windowId }) => ({ id, url: normalizedUrl, windowId })),
  );

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
