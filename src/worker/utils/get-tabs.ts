export const getCurrentTab = async () => {
  const [currentTab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!currentTab) {
    throw new Error('No active tab found in the current window.');
  }

  return currentTab;
};
