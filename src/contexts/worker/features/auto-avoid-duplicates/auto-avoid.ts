import { resolveDuplicatedCreatedTab } from '@/contexts/worker/features/auto-avoid-duplicates/resolve-duplicated-created-tab';
import {
  AUTO_AVOID_DUPLICATES_STARTUP_DELAY,
  AUTO_AVOID_DUPLICATES_TARGETABLE_PROTOCOLS,
} from '@/contexts/worker/features/auto-avoid-duplicates/settings';
import type { CreatedTab } from '@/contexts/worker/features/auto-avoid-duplicates/types';
import { getAllTabs } from '@/contexts/worker/utils';
import type { TabWithId } from '@/types';
import { getLocalStorage } from '@/utils';

let extensionStartedAt: number | null = null;

chrome.runtime.onStartup.addListener(() => {
  extensionStartedAt = Date.now();
});

const unresolvedTabIds = new Set<number>();
const processingTabIds = new Set<number>();

const resolveCreatedTab = async (createdTab: CreatedTab) => {
  if (processingTabIds.has(createdTab.id)) {
    return;
  }

  const saveData = await getLocalStorage('saveData');

  if (!saveData.autoAvoidDuplicate) {
    return;
  }

  processingTabIds.add(createdTab.id);

  try {
    // includeAllWindow が false のときはカレントウィンドウ以外を候補から外す
    const allTabs = await getAllTabs(saveData.includeAllWindow ? undefined : createdTab.windowId);
    const existingTabs = allTabs.filter((tab): tab is TabWithId => {
      return (
        typeof tab.id === 'number' && tab.id !== createdTab.id && !processingTabIds.has(tab.id)
      );
    });

    const result = resolveDuplicatedCreatedTab({
      createdTab,
      existingTabs,
      userSettings: {
        includeAllWindow: saveData.includeAllWindow,
        includePinnedTabs: saveData.includePinnedTabs,
        urlNormalizeOptions: {
          ignorePathname: saveData.ignorePathname,
          ignoreQuery: saveData.ignoreQuery,
          ignoreHash: saveData.ignoreHash,
          useAdvancedPathRule: saveData.useAdvancedPathRule,
          advancedPathRules: saveData.advancedPathRules,
        },
      },
    });

    if (result === null) {
      return;
    }

    // createdTab.active はイベント発火時点のスナップショットであり、ここまでの await
    // （getLocalStorage・getAllTabs）の間に、中クリック等でバックグラウンドで開かれた新規タブへ
    // ユーザーが自分で切り替えている可能性がある。閉じる直前に現在の状態を取り直して判定する。
    const freshCreatedTab = await chrome.tabs.get(createdTab.id).catch(() => null);

    if (!freshCreatedTab) {
      // 解決中に新規タブ自体が閉じられていた
      return;
    }

    if (freshCreatedTab.active) {
      // target="_blank"などで開かれた場合、既存の重複タブを近くに動かしてアクティブにしてから新規タブを閉じる。
      await chrome.tabs.move(result.keepTabId, {
        windowId: freshCreatedTab.windowId,
        index: freshCreatedTab.index + 1,
      });
      await chrome.tabs.update(result.keepTabId, { active: true });

      const targetWindow = await chrome.windows.get(freshCreatedTab.windowId);

      if (targetWindow.focused) {
        await chrome.windows.update(freshCreatedTab.windowId, { focused: true });
      }

      await chrome.tabs.remove(result.closeTabId);
      return;
    }

    // 新しいタブが開いたウィンドウのカレントタブ
    const activeTabInTargetWindow = existingTabs.find(
      (tab) => tab.windowId === freshCreatedTab.windowId && tab.active,
    );

    // カレントタブ以外と重複している場合は重複しているタブを動かしてから新規タブを閉じる
    if (activeTabInTargetWindow?.id !== result.keepTabId) {
      await chrome.tabs.move(result.keepTabId, {
        windowId: freshCreatedTab.windowId,
        index: activeTabInTargetWindow ? activeTabInTargetWindow.index + 1 : -1,
      });
    }

    // カレントタブと重複している場合は新規タブを閉じるだけ
    await chrome.tabs.remove(result.closeTabId);
  } catch {
    // move/update/remove等の途中でタブやウィンドウが消えていた場合、新規タブを閉じずに中断する。
  } finally {
    processingTabIds.delete(createdTab.id);
  }
};

/**
 * 新しい重複タブを抑制する
 *
 * 自動重複回避の有効・無効にかかわらず、新しく開かれたタブは常に監視する必要があるため、リスナーは常に登録する。
 */
export const registerAutoAvoidListeners = () => {
  chrome.tabs.onCreated.addListener((tab) => {
    if (typeof tab.id !== 'number') {
      return;
    }

    const isInStartupDelay =
      extensionStartedAt !== null &&
      Date.now() - extensionStartedAt < AUTO_AVOID_DUPLICATES_STARTUP_DELAY;

    // ブラウザ拡張が起動したタイミングから一定時間は動作させない
    if (isInStartupDelay) {
      return;
    }

    unresolvedTabIds.add(tab.id);
  });

  chrome.tabs.onRemoved.addListener((tabId) => {
    unresolvedTabIds.delete(tabId);
    processingTabIds.delete(tabId);
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (!unresolvedTabIds.has(tabId) || changeInfo.url === undefined) {
      return;
    }

    unresolvedTabIds.delete(tabId);

    try {
      const url = new URL(changeInfo.url);

      if (AUTO_AVOID_DUPLICATES_TARGETABLE_PROTOCOLS.has(url.protocol)) {
        void resolveCreatedTab({
          ...tab,
          id: tabId,
          url: changeInfo.url,
        });
      }
    } catch {
      // do nothing
    }
  });
};
