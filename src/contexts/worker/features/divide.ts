import type { ValidTab } from '@/contexts/worker/types';
import { getCurrentTab, getTabs } from '@/contexts/worker/utils';
import type { SaveDataType } from '@/utils';

const divideTabs = async (tabs: chrome.tabs.Tab[]) => {
  const currentTab = await getCurrentTab();
  const targetTabIdList = tabs
    .filter((tab): tab is ValidTab => typeof tab.id === 'number')
    .filter(({ id }) => id !== currentTab.id);
  const promises: Promise<chrome.windows.Window | chrome.tabs.Tab | undefined>[] = [];

  for (const { id: tabId } of targetTabIdList) {
    promises.push(chrome.windows.create({ tabId }));
  }

  await Promise.all(promises);

  for (const { id, pinned } of targetTabIdList) {
    void chrome.tabs.update(id, { pinned });
  }

  if (currentTab.id) {
    await chrome.windows.update(currentTab.windowId, { focused: true });
  }
};

interface Params {
  saveData: SaveDataType;
}

/** すべてのタブを別窓にする */
export const runDivide = async ({ saveData }: Params) => {
  const tabs = await getTabs(saveData);

  await divideTabs(tabs);
};
