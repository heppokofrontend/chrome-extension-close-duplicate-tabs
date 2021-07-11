import {parse} from './parse';

const tasks = {
  /**
   * タブを閉じる
   * @param tabs - アクティブウィンドウのタブリスト
   * @param ignore - URL Queryとhashを無視する
   */
  remove(tabs: chrome.tabs.Tab[], ignore: Message.ignore) {
    const duplicated = tabs.filter((item, idx, self) => {
      /**
       * array.findIndexのcallback関数
       * @param tab - アクティブウィンドウのタブオブジェクト
       * @returns - array.filterから渡されたタブオブジェクトとfindIndex中のカレントタブが同じURLかどうか
       */
      const findIndex = ({url}: chrome.tabs.Tab) => (
        url &&
        item.url &&
        parse(url, ignore) === parse(item.url, ignore)
      );
      const firstIdx = self.findIndex(findIndex);
      const reversed = [...self].reverse();
      const lastIdx = self.length - reversed.findIndex(findIndex) - 1;

      return (
        firstIdx === idx &&
        lastIdx !== idx
      );
    });

    for (const {id} of duplicated) {
      if (id) {
        chrome.tabs.remove(id);
      }
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
 * タブを閉じる
 * @param message - postMessageでpopup.tsからに渡されるメッセージ
 */
const closeTab = ({task, ignore}: Message.data) => {
  chrome.tabs.query({
    currentWindow: true,
  }, (tabs) => {
    console.log(ignore);

    tasks[task]?.(tabs, ignore);
  });
};

chrome.runtime.onConnect.addListener((port) => {
  port.onMessage.addListener(closeTab);
});
