export interface DuplicateCandidateTab {
  id: number;
  url?: string | undefined;
  windowId: number;
}

// ab218bc (Change tab closing logic): カレントタブの URL は常に「残す側」として
// checkedUrl に先読みで登録する。カレントタブがどの重複グループに属していても
// 誤って閉じられないようにするための挙動で、回帰させないよう純関数として固定する。
export const pickTabIdsToClose = ({
  candidateTabs,
  currentTabId,
  currentUrl,
  currentWindowId,
  includeAllWindow,
}: {
  candidateTabs: DuplicateCandidateTab[];
  currentTabId: number | undefined;
  currentUrl: string | null;
  currentWindowId: number | undefined;
  includeAllWindow: boolean | undefined;
}): number[] => {
  const checkedUrl = new Set<string>();
  const tabList = [...candidateTabs];

  if (currentWindowId && includeAllWindow) {
    tabList.sort((a, b) => {
      if (a.windowId === currentWindowId && b.windowId !== currentWindowId) {
        return -1;
      }

      if (a.windowId !== currentWindowId && b.windowId === currentWindowId) {
        return 1;
      }

      return 0;
    });
  }

  if (currentUrl) {
    checkedUrl.add(currentUrl);
  }

  return tabList
    .filter((tab): tab is DuplicateCandidateTab & { url: string } => {
      const { id, url } = tab;

      if (typeof url === 'undefined' || currentTabId === id) {
        return false;
      }

      if (checkedUrl.has(url)) {
        return true;
      }

      checkedUrl.add(url);
      return false;
    })
    .map(({ id }) => id);
};
