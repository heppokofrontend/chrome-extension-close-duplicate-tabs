import {
  normalizeUrl,
  type NormalizedUrl,
  type SaveDataType,
  type UrlNormalizeOptions,
} from '@/utils';
import { getGroupedTabsByNormalizedUrl } from '@/worker/utils/get-grouped-tabs-by-normalized-url';

interface DuplicateCandidateTab {
  id: number;
  url?: NormalizedUrl;
  windowId: number;
}

export const pickTabIdsToClose = ({
  candidateTabs,
  currentTabId,
  currentUrl,
  currentWindowId,
  includeAllWindow,
}: {
  candidateTabs: DuplicateCandidateTab[];
  currentTabId: number | undefined;
  currentUrl: NormalizedUrl | null;
  currentWindowId: number | undefined;
  includeAllWindow: boolean | undefined;
}): number[] => {
  const checkedUrl = new Set<NormalizedUrl>();
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

  // カレントタブは常に「残す側」にするため先に checkedUrl へ登録する。
  if (currentUrl) {
    checkedUrl.add(currentUrl);
  }

  return tabList
    .filter((tab): tab is DuplicateCandidateTab & { url: NormalizedUrl } => {
      const { id, url } = tab;

      if (url === undefined || currentTabId === id) {
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

interface TargetTab {
  id?: number | undefined;
  url?: string | undefined;
  windowId: number;
}

interface Params {
  currentTab: TargetTab;
  tabs: readonly TargetTab[];
  options: UrlNormalizeOptions & Pick<SaveDataType, 'includeAllWindow'>;
}

/**
 * 「重複タブをすべて閉じる」を実行したときに閉じられるタブの ID 一覧を求める。
 *
 * 前提：tabs は includeAllWindow / includePinnedTabs に応じて呼び出し側で絞り込み済みであること
 * （includeAllWindow はカレントウィンドウのタブを「残す側」に優先する並べ替えにのみ使う）。
 */
export const getDuplicatedTabIdsToClose = ({ currentTab, tabs, options }: Params): number[] => {
  const groupedTabs = getGroupedTabsByNormalizedUrl({ tabs, options });
  const duplicatedEntries = [...groupedTabs].filter(([, { length }]) => 2 <= length);
  const currentUrl = normalizeUrl(currentTab.url, options);

  // pickTabIdsToClose は url の同一性で「残す/閉じる」を決めるため、
  // グループ化キー（正規化 URL）を各タブの url に流し込んでおく。
  const candidateTabs = duplicatedEntries.flatMap(([normalizedUrl, tabItems]) =>
    tabItems
      .filter((tab): tab is TargetTab & { id: number } => typeof tab.id === 'number')
      .map(({ id, windowId }) => ({ id, url: normalizedUrl, windowId })),
  );

  return pickTabIdsToClose({
    candidateTabs,
    currentTabId: currentTab.id,
    currentUrl,
    currentWindowId: currentTab.windowId,
    includeAllWindow: options.includeAllWindow,
  });
};
