import { getMessage } from '@/utils';

const targets = document.querySelectorAll<HTMLElement>('[data-i18n]');

for (const elm of targets) {
  const { i18n } = elm.dataset;

  if (!i18n) {
    continue;
  }

  const textContent = getMessage(i18n);

  elm.textContent = textContent;
}

const primaryLanguage = chrome.i18n.getUILanguage().split(/[-_]/)[0];
document.documentElement.lang = primaryLanguage === 'ja' ? 'ja' : 'en';
