import { getSaveData } from '@/utils';
import { resolveDuplicatedCreatedTab } from '@/worker/features/auto-avoid-duplicates/resolve-duplicated-created-tab';
import {
  AUTO_AVOID_DUPLICATES_STARTUP_DELAY,
  AUTO_AVOID_DUPLICATES_TARGETABLE_PROTOCOLS,
} from '@/worker/features/auto-avoid-duplicates/settings';
import type { CreatedTab } from '@/worker/features/auto-avoid-duplicates/types';
import type { ValidTab } from '@/worker/types';
import { getAllTabs } from '@/worker/utils';

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

  const saveData = await getSaveData();

  if (!saveData.autoAvoidDuplicate) {
    return;
  }

  processingTabIds.add(createdTab.id);

  try {
    // includeAllWindow が false のときはカレントウィンドウ以外を候補から外す
    const allTabs = await getAllTabs(saveData.includeAllWindow ? undefined : createdTab.windowId);
    const existingTabs = allTabs.filter((tab): tab is ValidTab => {
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
        },
      },
    });

    if (result === null) {
      return;
    }

    if (createdTab.active) {
      // target="_blank"などで開かれた場合、既存の重複タブを近くに動かしてアクティブにしてから新規タブを閉じる。
      await chrome.tabs.move(result.keepTabId, {
        windowId: createdTab.windowId,
        index: createdTab.index + 1,
      });
      await chrome.tabs.update(result.keepTabId, { active: true });

      const targetWindow = await chrome.windows.get(createdTab.windowId);

      if (targetWindow.focused) {
        await chrome.windows.update(createdTab.windowId, { focused: true });
      }

      await chrome.tabs.remove(result.closeTabId);
      return;
    }

    // 新しいタブが開いたウィンドウのカレントタブ
    const activeTabInTargetWindow = existingTabs.find(
      (tab) => tab.windowId === createdTab.windowId && tab.active,
    );

    // カレントタブ以外と重複している場合は重複しているタブを動かしてから新規タブを閉じる
    if (activeTabInTargetWindow?.id !== result.keepTabId) {
      await chrome.tabs.move(result.keepTabId, {
        windowId: createdTab.windowId,
        index: activeTabInTargetWindow ? activeTabInTargetWindow.index + 1 : -1,
      });
    }

    // カレントタブと重複している場合は新規タブを閉じるだけ
    await chrome.tabs.remove(result.closeTabId);
    return;
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
