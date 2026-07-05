import type { SaveDataType } from '../utils/save-data';
import type { ValidTab as BaseValidTab } from './types';

import { getCurrentTab } from './utils';

type ValidTab = BaseValidTab & {
  url: string;
};
type CurrentPinnedTab = BaseValidTab & {
  url: string;
  pinned: true;
};

/** ホスト名ごとに別窓にする */
export const categorizeTabs = async (
  tabs: chrome.tabs.Tab[],
  minCategorizeNumber: SaveDataType['minCategorizeNumber'],
) => {
  const currentTab = await getCurrentTab();
  const hosts: Record<string, { tabId: number; pinned: boolean }[] | undefined> = {};
  const promises: (Promise<chrome.windows.Window> | Promise<void>)[] = [];
  const currentTabIsPinned = currentTab.pinned;
  const checkCurrentTabIsPinnedAndItDoesNotIncludesPinned = (
    tab: chrome.tabs.Tab,
  ): tab is CurrentPinnedTab => {
    return (
      !tabs.includes(tab) && tab.url !== undefined && tab.id !== undefined && currentTabIsPinned
    );
  };
  const ifCurrentTabIsPinnedAndItDoesNotIncludesPinned =
    checkCurrentTabIsPinnedAndItDoesNotIncludesPinned(currentTab);

  tabs
    .filter((tab): tab is ValidTab => {
      if (!tab.url || typeof tab.id !== 'number') {
        return false;
      }

      return true;
    })
    .forEach(({ url, id, pinned }) => {
      const { hostname } = new URL(url);

      if (!(hostname in hosts)) {
        hosts[hostname] = [];
      }

      hosts[hostname]?.push({ tabId: id, pinned });
    });

  if (ifCurrentTabIsPinnedAndItDoesNotIncludesPinned) {
    const { hostname } = new URL(currentTab.url);

    hosts[hostname] ??= [];
    hosts[hostname].unshift({ tabId: currentTab.id, pinned: currentTab.pinned });
  }

  if (typeof minCategorizeNumber === 'number' && minCategorizeNumber !== 0) {
    const OTHERS_HOST_NAME = '___OTHERS___';

    for (const [hostname, tabDataList] of Object.entries(hosts)) {
      if (!tabDataList?.length) {
        continue;
      }

      if (tabDataList.length <= minCategorizeNumber) {
        hosts[OTHERS_HOST_NAME] ??= [];
        hosts[OTHERS_HOST_NAME].unshift(...tabDataList);

        if (hosts[hostname]) {
          // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
          delete hosts[hostname];
        }
      }
    }
  }

  if (Object.keys(hosts).length < 2) {
    return;
  }

  for (const values of Object.values(hosts)) {
    const firstTab = values?.[0];

    if (!firstTab) {
      continue;
    }

    const windowPromise = chrome.windows.create({ tabId: firstTab.tabId }).then(async (created) => {
      const windowId = created?.id;

      if (typeof windowId !== 'number') {
        return;
      }

      const idList = values.slice(1);
      const promisesForTabMove: Promise<chrome.tabs.Tab | undefined>[] = [];

      void chrome.tabs.update(firstTab.tabId, { pinned: firstTab.pinned });

      for (const { tabId } of idList) {
        promisesForTabMove.push(chrome.tabs.move(tabId, { windowId, index: -1 }));
      }

      await Promise.all(promisesForTabMove);

      const promisesForTabUpdate: Promise<chrome.tabs.Tab | undefined>[] = [];

      for (const { tabId, pinned } of idList) {
        promisesForTabUpdate.push(chrome.tabs.update(tabId, { pinned }));
      }

      await Promise.all(promisesForTabUpdate);
    });

    promises.push(windowPromise);
  }

  await Promise.all(promises);

  if (currentTab.id) {
    const newCurrentTab = await chrome.tabs.get(currentTab.id);

    if (newCurrentTab.id) {
      await chrome.windows.update(newCurrentTab.windowId, { focused: true });
      await chrome.tabs.update(newCurrentTab.id, { active: true });

      if (currentTabIsPinned) {
        void chrome.tabs.update(newCurrentTab.id, {
          pinned: true,
        });
      }
    }
  }
};
