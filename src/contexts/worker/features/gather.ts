import { getCurrentTab } from '@/contexts/worker/utils';
import type { GatherDestination, GatherScope, TabWithIdAndUrl } from '@/types';
import { getTabs, type SaveDataType } from '@/utils';

const getTargetTabs = (tabs: chrome.tabs.Tab[], origin: string) =>
  tabs.filter((tab): tab is TabWithIdAndUrl => {
    if (!tab.url || typeof tab.id !== 'number') {
      return false;
    }

    try {
      return new URL(tab.url).origin === origin;
    } catch {
      return false;
    }
  });

const moveIntoCurrentWindow = async (targetTabs: TabWithIdAndUrl[]) => {
  const { id: currentTabId, windowId } = await getCurrentTab();

  await Promise.all(targetTabs.map(({ id }) => chrome.tabs.move(id, { windowId, index: -1 })));

  for (const { id, pinned } of targetTabs) {
    void chrome.tabs.update(id, { pinned });
  }

  return { currentTabId, windowId };
};

const gatherIntoCurrentWindow = async (targetTabs: TabWithIdAndUrl[]) => {
  const { currentTabId } = await moveIntoCurrentWindow(targetTabs);

  if (currentTabId) {
    await chrome.tabs.update(currentTabId, { active: true });
  }
};

const gatherIntoCurrentWindowAsGroup = async (targetTabs: TabWithIdAndUrl[], origin: string) => {
  const { id: currentTabId, windowId } = await getCurrentTab();

  await Promise.all(targetTabs.map(({ id }) => chrome.tabs.move(id, { windowId, index: -1 })));
  // ピン留めタブはタブグループに追加できない（Chromeの仕様）ため、グループ化前にピン留めを解除する。
  await Promise.all(targetTabs.map(({ id }) => chrome.tabs.update(id, { pinned: false })));

  // chrome.tabs.group の tabIds は空配列を許さないタプル型のため、先頭要素を分離して型を合わせる。
  const [firstTabId, ...restTabIds] = targetTabs.map(({ id }) => id);

  if (firstTabId === undefined) {
    return;
  }

  const groupId = await chrome.tabs.group({
    tabIds: [firstTabId, ...restTabIds],
    createProperties: { windowId },
  });

  const { host } = new URL(origin);

  await chrome.tabGroups.update(groupId, { title: host || origin });

  if (currentTabId) {
    await chrome.tabs.update(currentTabId, { active: true });
  }
};

const gatherIntoNewWindow = async ([firstTab, ...restTabs]: TabWithIdAndUrl[]) => {
  if (!firstTab) {
    return;
  }

  const created = await chrome.windows.create({ tabId: firstTab.id });
  const windowId = created?.id;

  if (typeof windowId !== 'number') {
    return;
  }

  void chrome.tabs.update(firstTab.id, { pinned: firstTab.pinned });

  await Promise.all(restTabs.map(({ id }) => chrome.tabs.move(id, { windowId, index: -1 })));

  for (const { id, pinned } of restTabs) {
    void chrome.tabs.update(id, { pinned });
  }
};

interface Params {
  saveData: SaveDataType;
  origin: string;
  scope: GatherScope;
  destination: GatherDestination;
}

/** 特定のoriginのタブを集める */
export const runGather = async ({ saveData, origin, scope, destination }: Params) => {
  const tabs = await getTabs({ ...saveData, includeAllWindow: scope === 'allWindows' });
  const targetTabs = getTargetTabs(tabs, origin);

  if (targetTabs.length === 0) {
    return;
  }

  if (destination === 'newWindow') {
    await gatherIntoNewWindow(targetTabs);
    return;
  }

  if (destination === 'currentWindowGroup') {
    await gatherIntoCurrentWindowAsGroup(targetTabs, origin);
    return;
  }

  await gatherIntoCurrentWindow(targetTabs);
};
