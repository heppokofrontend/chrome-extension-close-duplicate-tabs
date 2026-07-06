import type { SaveDataType } from '@/utils';
import type { ValidTab } from '@/worker/types';
import { getCurrentTab, getTabs } from '@/worker/utils';

const combineTabs = async (tabs: chrome.tabs.Tab[]) => {
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

interface Params {
  saveData: SaveDataType;
}

/** 全ウィンドウを１つにまとめる */
export const runCombine = async ({ saveData }: Params) => {
  // combine は常に全ウィンドウ対象。
  const tabs = await getTabs({ ...saveData, includeAllWindow: true });

  await combineTabs(tabs);
};
