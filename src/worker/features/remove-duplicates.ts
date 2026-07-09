import type { SaveDataType } from '@/utils';
import {
  getCurrentTab,
  getDuplicatedTabIdsToClose,
  getGroupedTabsByNormalizedUrl,
  getTabs,
} from '@/worker/utils';

let duplicatedListWindow: chrome.windows.Window | null = null;

const openDuplicateListWindow = async ({
  currentTab,
  tabs,
  saveData,
}: {
  currentTab: chrome.tabs.Tab;
  tabs: chrome.tabs.Tab[];
  saveData: SaveDataType;
}) => {
  const groupedTabs = getGroupedTabsByNormalizedUrl({ tabs, options: saveData });
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
};

const removeDuplicatedTabs = async ({
  tabs,
  options,
}: {
  tabs: chrome.tabs.Tab[];
  options: {
    saveData: SaveDataType;
    shouldShowDuplicatePage?: boolean | undefined;
  };
}) => {
  const { saveData, shouldShowDuplicatePage } = options;
  const currentTab = await getCurrentTab();

  if (shouldShowDuplicatePage === true) {
    void openDuplicateListWindow({
      currentTab,
      tabs,
      saveData,
    });

    return;
  }

  const targetTabIdList = getDuplicatedTabIdsToClose({
    currentTab,
    tabs,
    options: saveData,
  });

  for (const id of targetTabIdList) {
    void chrome.tabs.remove(id);
  }
};

interface Params {
  saveData: SaveDataType;
  shouldShowDuplicatePage?: boolean | undefined;
}

/** 重複したタブを閉じる */
export const runRemove = async ({ saveData, shouldShowDuplicatePage }: Params) => {
  const tabs = await getTabs(saveData);

  await removeDuplicatedTabs({ tabs, options: { saveData, shouldShowDuplicatePage } });
};
