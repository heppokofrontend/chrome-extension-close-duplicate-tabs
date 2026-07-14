export const getMessage = (key: string, substitutions?: string | string[]) =>
  chrome.i18n.getMessage(key, substitutions);
