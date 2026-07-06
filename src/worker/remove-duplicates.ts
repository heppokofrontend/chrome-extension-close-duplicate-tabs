import type { SaveDataType } from '@/utils';
import {
  getCurrentTab,
  getDuplicatedTabIdsToClose,
  getGroupedTabsByNormalizedUrl,
} from '@/worker/utils';

let duplicatedListWindow: chrome.windows.Window | null = null;

/** 重複したタブを閉じる */
export const removeDuplicatedTabs = async (
  tabs: chrome.tabs.Tab[],
  options: SaveDataType & { shouldShowDuplicatePage?: boolean },
) => {
  const currentTab = await getCurrentTab();

  if (options.shouldShowDuplicatePage === true) {
    const groupedTabs = getGroupedTabsByNormalizedUrl(tabs, options);
    const duplicatedEntries = [...groupedTabs].filter(([, { length }]) => 2 <= length);

    await chrome.storage.session.set({
      lastWindowId: currentTab.windowId,
      duplicatedEntries,
    });

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

  const targetTabIdList = getDuplicatedTabIdsToClose(tabs, options, currentTab);

  for (const id of targetTabIdList) {
    void chrome.tabs.remove(id);
  }
};
