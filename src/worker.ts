// Utils
const parseUrl = (url: URL, options?: SaveDataType) => {
  const { origin, hash, search } = url;
  const pathname = url.pathname.replace(/\/index\.(x?html?|php|cgi|aspx)$/, '/');

  return {
    origin,
    hash: options?.ignoreHash ? '' : hash,
    search: options?.ignoreQuery ? '' : search,
    pathname: options?.ignorePathname ? '' : pathname,
  };
};
const getUrl = (url: string | undefined, options?: SaveDataType) => {
  if (!url) {
    return null;
  }

  const { origin, pathname, search, hash } = parseUrl(new URL(url), options);

  return `${origin}${pathname}${search}${hash}`;
};

const getCurrentTab = async () =>
  (await chrome.tabs.query({ active: true, currentWindow: true }))[0];

// Tasks
const removeDuplicatedTabs = async (tabs: chrome.tabs.Tab[], options: SaveDataType) => {
  type ValidTab = chrome.tabs.Tab & {
    id: number;
    url: string;
  };

  const currentTab = await getCurrentTab();
  const currentUrl = getUrl(currentTab.url, options);
  const checkedUrl = new Set<string>();

  if (currentUrl) {
    checkedUrl.add(currentUrl);
  }

  const targetTabIdList = tabs
    .filter((tab): tab is ValidTab => {
      const { id } = tab;
      const url = getUrl(tab.url, options);

      if (!url || typeof id !== 'number') {
        return false;
      }

      if (checkedUrl.has(url) && currentTab.id !== id) {
        return true;
      }

      checkedUrl.add(url);

      return false;
    })
    .map(({ id }) => id);

  for (const id of targetTabIdList) {
    chrome.tabs.remove(id);
  }
};

const categorizeTabs = async (
  tabs: chrome.tabs.Tab[],
  minCategorizeNumber: SaveDataType['minCategorizeNumber'],
) => {
  type ValidTab = chrome.tabs.Tab & {
    id: number;
    url: string;
  };
  type CurrentPinnedTab = chrome.tabs.Tab & {
    id: number;
    url: string;
    pinned: true;
  };

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
    hosts[hostname]?.unshift({ tabId: currentTab.id, pinned: currentTab.pinned });
  }

  if (typeof minCategorizeNumber === 'number' && minCategorizeNumber !== 0) {
    const OTHERS_HOST_NAME = '___OTHRERS___';

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

    const windowPromise = chrome.windows
      .create({ tabId: firstTab.tabId })
      .then(async ({ id: windowId }) => {
        const idList = values.slice(1);
        const promisesForTabMove: Promise<chrome.tabs.Tab>[] = [];

        chrome.tabs.update(firstTab.tabId, { pinned: firstTab.pinned });

        for (const { tabId } of idList) {
          promisesForTabMove.push(chrome.tabs.move(tabId, { windowId, index: -1 }));
        }

        await Promise.all(promisesForTabMove);

        const promisesForTabUpdate: Promise<chrome.tabs.Tab>[] = [];

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
        chrome.tabs.update(newCurrentTab.id, {
          pinned: true,
        });
      }
    }
  }
};

const divideTabs = async (tabs: chrome.tabs.Tab[]) => {
  type ValidTab = chrome.tabs.Tab & { id: number };

  const currentTab = await getCurrentTab();
  const targetTabIdList = tabs
    .filter((tab): tab is ValidTab => typeof tab.id === 'number')
    .filter(({ id }) => id !== currentTab.id);
  const promises: Promise<chrome.windows.Window | chrome.tabs.Tab>[] = [];

  for (const { id: tabId } of targetTabIdList) {
    promises.push(chrome.windows.create({ tabId }));
  }

  await Promise.all(promises);

  for (const { id, pinned } of targetTabIdList) {
    chrome.tabs.update(id, { pinned });
  }

  if (currentTab.id) {
    await chrome.windows.update(currentTab.windowId, { focused: true });
  }
};

const combineTabs = async (tabs: chrome.tabs.Tab[]) => {
  type ValidTab = chrome.tabs.Tab & {
    id: number;
  };

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
    chrome.tabs.update(id, { pinned });
  }

  if (currentTabId) {
    await chrome.tabs.update(currentTabId, { active: true });
  }
};

const sortTabs = async (tabs: chrome.tabs.Tab[], sort: SortType | undefined) => {
  interface TabData {
    id: number;
    hostname: string;
    url: string;
    title: string;
    pinned: boolean;
    windowId: number;
  }

  const compareByUrl = (a: TabData, b: TabData) => {
    if (a.url < b.url) {
      return -1;
    }

    if (a.url > b.url) {
      return 1;
    }

    return 0;
  };
  const compareByTitle = (a: TabData, b: TabData) => {
    if (a.title < b.title) {
      return -1;
    }

    if (a.title > b.title) {
      return 1;
    }

    return 0;
  };
  const compareByHostAndTitle = (a: TabData, b: TabData) => {
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
  const tabSet: Record<number, TabData[] | undefined> = {};
  const sorter =
    sort === 'sortByUrl'
      ? compareByUrl
      : sort === 'sortByTitle'
      ? compareByTitle
      : compareByHostAndTitle;

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
    .filter((tab): tab is TabData => {
      return (
        typeof tab.url === 'string' && typeof tab.title === 'string' && typeof tab.id === 'number'
      );
    })
    .forEach((tabData) => {
      const { windowId } = tabData;
      tabSet[windowId] ??= [];
      tabSet[windowId]?.push(tabData);
    });

  for (const tabList of Object.values(tabSet)) {
    tabList?.sort(sorter);
  }

  const tabList = Object.values(tabSet).flat();
  let i = 0;
  const limit = tabList.length;

  for (i; i < limit; i++) {
    const item = tabList[i];

    if (typeof item === 'undefined') {
      continue;
    }

    const { id, pinned, windowId } = item;

    await chrome.tabs.move(id, {
      windowId,
      index: i + (pinned ? 0 : limit),
    });
  }
};

chrome.runtime.onConnect.addListener((port) => {
  interface Request {
    taskName?: string;
    options?: SaveDataType & { sort: SortType };
  }

  const onmessageListener = (request: Request) => {
    const callTaskFunctions = async ({ taskName, options }: Request) => {
      const currentWindow =
        taskName !== 'combine' && !Boolean(options?.includeAllWindow) ? true : undefined;
      const pinned = Boolean(options?.includePinnedTabs) ? undefined : false;
      const tabs = await chrome.tabs.query({
        windowType: 'normal',
        currentWindow,
        pinned,
      });

      switch (taskName) {
        case 'reload':
          for (const { id } of tabs) {
            if (typeof id === 'number') {
              // NOTE: リロード後に音声を停止させる処理を実装したいが、現状 tabs 経由では不可能な模様
              chrome.tabs.reload(id);
            }
          }

          return;

        case 'remove':
          await removeDuplicatedTabs(tabs, options ?? {});
          return;

        case 'categorize':
          await categorizeTabs(tabs, options?.minCategorizeNumber);
          return;

        case 'divide':
          await divideTabs(tabs);
          return;

        case 'combine':
          await combineTabs(tabs);
          return;

        case 'sort':
          await sortTabs(tabs, options?.sort);
          return;
      }
    };

    callTaskFunctions(request);

    return true;
  };

  port.onMessage.addListener(onmessageListener);
});
