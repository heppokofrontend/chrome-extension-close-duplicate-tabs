import { getCurrentTab, getDuplicatedTabIdsToClose, getTabs } from '@/contexts/worker/utils';
import { getSaveData, normalizeUrl, type SaveDataType } from '@/utils';

// package/styles/popup.css の `.img::before` background と同じ色に揃えること
const BADGE_BACKGROUND_COLOR = '#c62828';

/** updateBadgeMode に応じてバッジへ表示すべき数を求める。非表示は 0。 */
const getBadgeCount = async (saveData: Required<SaveDataType>): Promise<number> => {
  if (saveData.updateBadgeMode === 'none') {
    return 0;
  }

  const currentTab = await getCurrentTab();
  const tabs = await getTabs(saveData);

  // all: 「重複タブをすべて閉じる」で実際に閉じられるタブの総数
  if (saveData.updateBadgeMode === 'all') {
    return getDuplicatedTabIdsToClose({ currentTab, tabs, options: saveData }).length;
  }

  // current: カレントタブと同じ正規化 URL を持つ、カレント以外のタブの数
  const currentUrl = normalizeUrl(currentTab.url, saveData);

  if (!currentUrl) {
    return 0;
  }

  return tabs.filter(
    (tab) => tab.id !== currentTab.id && normalizeUrl(tab.url, saveData) === currentUrl,
  ).length;
};

/**
 * 直近の呼び出しだけがバッジへ書き込めるようにするためのカウンタ。
 * タブの一斉削除などでイベントが連発すると updateBadge が並走し、
 * 完了順の逆転によって古い数が最後に書き込まれるのを防ぐ。
 */
let updateVersion = 0;

const updateBadge = async () => {
  const version = ++updateVersion;
  const saveData = await getSaveData();
  let count = 0;

  try {
    count = await getBadgeCount(saveData);
  } catch {
    // カレントタブを取得できない状況（全ウィンドウが非フォーカスなど）ではバッジを消す。
  }

  if (version !== updateVersion) {
    return;
  }

  await chrome.action.setBadgeText({ text: 0 < count ? String(count) : '' });
};

/** タブの増減・URL変更・タブ切替・ウィンドウ切替・設定変更のたびにバッジの重複数を更新する */
export const registerUpdateBadgeListeners = () => {
  void chrome.action.setBadgeBackgroundColor({ color: BADGE_BACKGROUND_COLOR });

  chrome.tabs.onCreated.addListener(() => void updateBadge());
  chrome.tabs.onRemoved.addListener(() => void updateBadge());
  chrome.tabs.onUpdated.addListener((_tabId, changeInfo) => {
    if (changeInfo.url !== undefined || changeInfo.pinned !== undefined) {
      void updateBadge();
    }
  });
  chrome.tabs.onActivated.addListener(() => void updateBadge());
  chrome.tabs.onAttached.addListener(() => void updateBadge());
  chrome.tabs.onDetached.addListener(() => void updateBadge());
  // プリレンダー確定など、タブが ID ごと置き換わるケースを拾う。
  chrome.tabs.onReplaced.addListener(() => void updateBadge());
  chrome.windows.onFocusChanged.addListener((windowId) => {
    // Chrome ではウィンドウが非フォーカスになると windowId が -1 になる
    if (windowId === -1) {
      return;
    }

    void updateBadge();
  });
  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === 'local' && 'saveData' in changes) {
      void updateBadge();
    }
  });

  void updateBadge();
};
