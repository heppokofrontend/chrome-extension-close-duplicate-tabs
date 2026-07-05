import type { ValidTab } from '@/worker/types';
import { getCurrentTab } from '@/worker/utils';

/** 全ウィンドウを１つにまとめる */
export const combineTabs = async (tabs: chrome.tabs.Tab[]) => {
  const { id: currentTabId, windowId } = await getCurrentTab();
  const targetTabIdList = tabs.filter((tab): tab is ValidTab => typeof tab.id === 'number');
  const promises: Promise<chrome.tabs.Tab>[] = [];

  for (const { id } of targetTabIdList) {
    promises.push(
      chrome.tabs.move(id, {
        windowId,
        index: -1,
      }),
    );
  }

  await Promise.all(promises);

  for (const { id, pinned } of targetTabIdList) {
    void chrome.tabs.update(id, { pinned });
  }

  if (currentTabId) {
    await chrome.tabs.update(currentTabId, { active: true });
  }
};
