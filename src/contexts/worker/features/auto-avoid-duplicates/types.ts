export type CreatedTab = Pick<
  chrome.tabs.Tab,
  'active' | 'index' | 'windowId' | 'pinned' | 'groupId'
> & {
  id: number;
  url: string;
};
