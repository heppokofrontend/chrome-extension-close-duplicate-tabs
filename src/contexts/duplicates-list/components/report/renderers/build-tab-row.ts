import type { ValidTab } from '@/contexts/duplicates-list/components/report/types';

const escapeHtml = (value: string) =>
  value.replace(
    /[&<>"']/g,
    (char) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[char] as string,
  );

export const buildTabRow = (
  tbody: HTMLTableSectionElement,
  tab: ValidTab,
  closedMessage: string,
) => {
  const openTabLabel = chrome.i18n.getMessage('duplicates_open_tab', String(tab.id));

  tbody.insertAdjacentHTML(
    'afterbegin',
    `
    <tr>
      <th scope="row"><button type="button" aria-label="${escapeHtml(openTabLabel)}">
        <span>${tab.id}</span>
        <img src="./images/open.svg" />
      </button></th>
      <td class="title">
        <div>${escapeHtml(tab.title ?? '')}</div>
        <div role="alert"><span class="status">${closedMessage}</span></div>
      </td>
    </tr>
  `,
  );

  const button = tbody.querySelector('button');
  const tr = tbody.querySelector('tr');
  button?.addEventListener('click', () => {
    const tabId = tab.id;

    chrome.tabs.update(tabId, { active: true }, () => {
      if (chrome.runtime.lastError && tr) {
        tr.dataset['closed'] = 'true';
        button.setAttribute('aria-disabled', 'true');
        return;
      }

      chrome.windows.update(tab.windowId, { focused: true }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
      });
    });
  });
};
