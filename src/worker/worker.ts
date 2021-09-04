import {parse} from './parse';

const tasks = {
  /**
   * タブを閉じる
   * @param tabs - アクティブウィンドウのタブリスト
   * @param ignore - URL Queryとhashを無視する
   */
  remove(tabs: chrome.tabs.Tab[], ignore: Message.ignore) {
    const checkedUrl = new Set<string>();
    const duplicated: number[] = [];

    for (const tab of tabs) {
      if (
        !tab.url ||
        typeof tab.id !== 'number'
      ) {
        continue;
      }

      const url = parse(tab.url, ignore);

      if (checkedUrl.has(url)) {
        duplicated.push(tab.id);
      }

      checkedUrl.add(url);
    }

    for (const id of duplicated) {
      chrome.tabs.remove(id);
    }
  },
  /**
   * タブを更新する
   * @param tabs - アクティブウィンドウのタブリスト
   */
  reload(tabs: chrome.tabs.Tab[]) {
    for (const {id} of tabs) {
      if (id) {
        chrome.tabs.reload(id);
      }
    }
  },
};

/**
 * タスクの実行
 * @param message - postMessageでpopup.tsからに渡されるメッセージ
 */
const closeTab = async ({task, ignore}: Message.data) => {
  const tabs = await chrome.tabs.query({
    currentWindow: true,
  });

  tasks[task]?.(tabs, ignore);
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(closeTab);
});
