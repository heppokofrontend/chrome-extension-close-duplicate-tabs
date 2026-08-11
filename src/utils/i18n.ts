export const getMessage = (
  key: string,
  substitutions?: string | string[],
  options?: { allowEmpty: boolean },
) => {
  const message = chrome.i18n.getMessage(key, substitutions);

  if (message === '' && !options?.allowEmpty) {
    throw new Error(`i18n message not found: ${key}`);
  }

  return message;
};
