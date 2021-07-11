import {STATE} from './state';

// 他言語処理
const targets = document.querySelectorAll<HTMLElement>('[data-i18n]');

for (const elm of targets) {
  const {i18n} = elm.dataset;

  if (!i18n) {
    continue;
  }

  const textContent = chrome.i18n.getMessage(i18n);

  elm.textContent = textContent;
}

// チェックボックスの状態を復帰
chrome.storage.local.get(['noQuery', 'noHash'], (values: Message.ignore) => {
  for (const [a, b] of Object.entries(values)) {
    const key = a as Message.ignoreType;
    const value = !!b;
    const checkbox = document.querySelector<HTMLInputElement>(`[data-name=${key}]`);

    STATE[key] = value;

    if (checkbox) {
      checkbox.checked = value;
    }
  }

  // CSS Transitionの有効化
  document.body.dataset.state = 'loaded';
});
