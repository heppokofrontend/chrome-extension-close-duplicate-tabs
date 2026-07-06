import { normalizeUrl, type UrlNormalizeOptions } from '@/utils';
import type { CreatedTab } from '@/worker/auto-avoid-duplicates/types';
import { getGroupedTabsByNormalizedUrl } from '@/worker/utils';

interface CandidateTab {
  id: number;
  url?: string | undefined;
  windowId: number;
  pinned?: boolean;
}

interface Params {
  createdTab: CreatedTab;
  existingTabs: CandidateTab[];
  userSettings: {
    includeAllWindow: boolean | undefined;
    includePinnedTabs: boolean | undefined;
    urlNormalizeOptions?: UrlNormalizeOptions;
  };
}

/** 新規タブと重複する既存タブがあれば、閉じる側・残す側を決定する。重複がなければ null。 */
export const resolveDuplicatedCreatedTab = ({
  createdTab,
  existingTabs,
  userSettings: { includeAllWindow, includePinnedTabs, urlNormalizeOptions },
}: Params) => {
  if (createdTab.pinned && !includePinnedTabs) {
    return null;
  }

  const targetUrl = normalizeUrl(createdTab.url, urlNormalizeOptions);

  if (!targetUrl) {
    return null;
  }

  const sameUrlTabs = getGroupedTabsByNormalizedUrl(existingTabs, urlNormalizeOptions).get(
    targetUrl,
  );
  const candidates = (sameUrlTabs ?? []).filter((tab) => {
    if (tab.id === createdTab.id) {
      return false;
    }

    if (tab.pinned && !includePinnedTabs) {
      return false;
    }

    if (!includeAllWindow && tab.windowId !== createdTab.windowId) {
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
