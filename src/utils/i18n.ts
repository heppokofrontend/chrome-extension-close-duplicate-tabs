export const getMessage = (key: string, substitutions?: string | string[]) => {
  const message = chrome.i18n.getMessage(key, substitutions);

  if (message === '') {
    throw new Error(`i18n message not found: ${key}`);
  }

  return message;
};
