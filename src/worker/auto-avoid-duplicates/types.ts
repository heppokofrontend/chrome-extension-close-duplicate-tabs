export type CreatedTab = Pick<chrome.tabs.Tab, 'active' | 'index' | 'windowId' | 'pinned'> & {
  id: number;
  url: string;
};
