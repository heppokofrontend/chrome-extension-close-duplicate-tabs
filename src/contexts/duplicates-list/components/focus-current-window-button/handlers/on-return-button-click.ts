export const createOnReturnButtonClick = (lastWindowId: number | undefined) => () => {
  if (typeof lastWindowId !== 'number') {
    return;
  }

  chrome.windows.update(lastWindowId, { focused: true }, () => {
    if (chrome.runtime.lastError) {
      alert(chrome.i18n.getMessage('duplicates_already_closed'));
    }
  });
};
