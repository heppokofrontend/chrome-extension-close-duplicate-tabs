import type { SaveDataType } from '@/utils';
import { getTabs } from '@/worker/utils';

export const sortTypes = ['sortByUrl', 'sortByTitle', 'sortByHostAndTitle'] as const;
export type SortType = (typeof sortTypes)[number];

export type SortableTab = {
  id: number;
  hostname: string;
  url: string;
  title: string;
  pinned: boolean;
  windowId: number;
};

const compareByUrl = (a: SortableTab, b: SortableTab) => {
  if (a.url < b.url) {
    return -1;
  }

  if (a.url > b.url) {
    return 1;
  }

  return 0;
};

const compareByTitle = (a: SortableTab, b: SortableTab) => {
  if (a.title < b.title) {
    return -1;
  }

  if (a.title > b.title) {
    return 1;
  }

  return 0;
};

const compareByHostAndTitle = (a: SortableTab, b: SortableTab) => {
  if (a.hostname < b.hostname) {
    return -1;
  }

  if (a.hostname > b.hostname) {
    return 1;
  }

  if (a.title < b.title) {
    return -1;
  }

  if (a.title > b.title) {
    return 1;
  }

  return 0;
};

export const getSorter = (sortType: SortType | undefined) => {
  if (sortType === 'sortByUrl') {
    return compareByUrl;
  }

  if (sortType === 'sortByTitle') {
    return compareByTitle;
  }

  return compareByHostAndTitle;
};

export const sortTabs = async (tabs: chrome.tabs.Tab[], sortType?: SortType) => {
  const tabSet: Record<number, SortableTab[] | undefined> = {};
  const sorter = getSorter(sortType);

  tabs
    .map(({ id, pinned, url, title, windowId }) => {
      const hostname = url && new URL(url).hostname;
      return {
        id,
        url,
        hostname,
        title,
        pinned,
        windowId,
      };
    })
    .filter((tab): tab is SortableTab => {
      return (
        typeof tab.url === 'string' && typeof tab.title === 'string' && typeof tab.id === 'number'
      );
    })
    .forEach((tabData) => {
      const { windowId } = tabData;
      tabSet[windowId] ??= [];
      tabSet[windowId].push(tabData);
    });

  for (const tabList of Object.values(tabSet)) {
    tabList?.sort(sorter);
  }

  const tabList = Object.values(tabSet).flat();
  let i = 0;
  const limit = tabList.length;

  for (i; i < limit; i++) {
    const item = tabList[i];

    if (item === undefined) {
      continue;
    }

    const { id, pinned, windowId } = item;

    await chrome.tabs.move(id, {
      windowId,
      index: i + (pinned ? 0 : limit),
    });
  }
};

interface Params {
  saveData: SaveDataType;
  sort: SortType | undefined;
}

/** タブを並び変える */
export const runSort = async ({ saveData, sort }: Params) => {
  const tabs = await getTabs(saveData);

  await sortTabs(tabs, sort);
};
