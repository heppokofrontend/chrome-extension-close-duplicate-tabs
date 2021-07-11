import {STATE} from './state';

const port = chrome.runtime.connect();
const checkboxes = document.querySelectorAll<HTMLInputElement>('[data-name]');
const btns = document.querySelectorAll<HTMLButtonElement>('button');
const handler = {
  /**
   * button要素のためのclickイベントハンドラ
   * @param this - クリックされたButton要素
   */
  btnOnClick(this: HTMLButtonElement) {
    const task = this.dataset.task || '';

    port.postMessage({
      task,
      ignore: STATE,
    });
  },
  /**
   * チェックボックスのためのchangeイベントハンドラ
   * @param this - 操作されたInput[type=checkbox]要素
   */
  checkboxOnChange(this: HTMLInputElement) {
    const data: Message.ignore = {};

    if (
      this.dataset.name === 'noQuery' ||
      this.dataset.name === 'noHash'
    ) {
      STATE[this.dataset.name] = this.checked;
      data[this.dataset.name] = this.checked;

      console.log(STATE);

      chrome.storage.local.set(data);
    }
  },
};

for (const btn of btns) {
  btn.addEventListener('click', handler.btnOnClick);
}

for (const checkbox of checkboxes) {
  checkbox.addEventListener('change', handler.checkboxOnChange);
}
