import type { CreatedTab } from '@/contexts/worker/features/auto-avoid-duplicates/types';
import { getGroupedTabsByNormalizedUrl, normalizeUrl } from '@/contexts/worker/utils';
import { isInTabGroup, type UrlNormalizeOptions } from '@/utils';

interface CandidateTab {
  id: number;
  url?: string | undefined;
  windowId: number;
  pinned?: boolean;
  groupId?: number;
}

interface Params {
  createdTab: CreatedTab;
  existingTabs: CandidateTab[];
  userSettings: {
    includeAllWindow: boolean | undefined;
    includePinnedTabs: boolean | undefined;
    includeGroupedTabs: boolean | undefined;
    urlNormalizeOptions?: UrlNormalizeOptions;
  };
}

/** 新規タブと重複する既存タブがあれば、閉じる側・残す側を決定する。重複がなければ null。 */
export const resolveDuplicatedCreatedTab = ({
  createdTab,
  existingTabs,
  userSettings: { includeAllWindow, includePinnedTabs, includeGroupedTabs, urlNormalizeOptions },
}: Params) => {
  if (
    (createdTab.pinned && !includePinnedTabs) ||
    (includeGroupedTabs === false && isInTabGroup(createdTab.groupId))
  ) {
    return null;
  }

  const targetUrl = normalizeUrl(createdTab.url, urlNormalizeOptions);

  if (!targetUrl) {
    return null;
  }

  const sameUrlTabs = getGroupedTabsByNormalizedUrl({
    tabs: existingTabs,
    options: urlNormalizeOptions,
  }).get(targetUrl);
  const candidates = (sameUrlTabs ?? []).filter((tab) => {
    if (
      tab.id === createdTab.id ||
      (tab.pinned && !includePinnedTabs) ||
      (includeGroupedTabs === false && isInTabGroup(tab.groupId)) ||
      (!includeAllWindow && tab.windowId !== createdTab.windowId)
    ) {
      return false;
    }

    return true;
  });

  const [firstCandidate, ...restCandidates] = candidates;

  if (!firstCandidate) {
    return null;
  }

  const keepTab = restCandidates.reduce(
    (oldest, tab) => (tab.id < oldest.id ? tab : oldest),
    firstCandidate,
  );

  return {
    closeTabId: createdTab.id,
    keepTabId: keepTab.id,
  };
};
