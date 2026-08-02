export type ValidTab = chrome.tabs.Tab & {
  id: number;
  url: string;
};
