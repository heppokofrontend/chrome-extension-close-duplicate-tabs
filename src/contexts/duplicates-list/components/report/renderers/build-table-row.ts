import type { TabWithIdAndUrl } from '@/types';
import { getMessage } from '@/utils';

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

export const buildTableRow = (tbody: HTMLTableSectionElement, tab: TabWithIdAndUrl) => {
  const openTabLabel = getMessage('duplicates_open_tab', String(tab.id));
  const closeTabLabel = getMessage('duplicates_close_tab', tab.title ?? String(tab.id));
  const closedMessage = getMessage('duplicates_already_closed');

  tbody.insertAdjacentHTML(
    'afterbegin',
    `
    <tr>
      <th scope="row"><button type="button" class="btn-focus" aria-label="${escapeHtml(openTabLabel)}">
        <span>${tab.id}</span>
        <img src="./images/open.svg" alt="" />
      </button></th>
      <td class="title">
        <div>${escapeHtml(tab.title ?? '')}</div>
        <div role="alert"><span class="status"></span></div>
      </td>
      <td class="close">
        <button type="button" aria-label="${tab.id}: ${escapeHtml(closeTabLabel)}">
          <img src="./images/close.svg" alt="" />
        </button>
      </td>
    </tr>
  `,
  );

  const tr = tbody.querySelector('tr');
  const statusEl = tr?.querySelector<HTMLElement>('.status');
  const openButton = tr?.querySelector<HTMLButtonElement>('th button');
  const closeButton = tr?.querySelector<HTMLButtonElement>('td.close button');

  const markClosed = (status: 'already-closed' | 'closed') => {
    if (tr) {
      tr.dataset['status'] = status;
    }
    openButton?.setAttribute('aria-disabled', 'true');
    closeButton?.setAttribute('aria-disabled', 'true');
    if (statusEl) {
      statusEl.textContent = closedMessage;
    }
  };

  openButton?.addEventListener('click', () => {
    const tabId = tab.id;

    chrome.tabs.update(tabId, { active: true }, () => {
      if (chrome.runtime.lastError) {
        markClosed('already-closed');
        return;
      }

      chrome.windows.update(tab.windowId, { focused: true }, () => {
        if (chrome.runtime.lastError) {
          console.error(chrome.runtime.lastError.message);
        }
      });
    });
  });

  closeButton?.addEventListener('click', () => {
    markClosed('closed');

    chrome.tabs.remove(tab.id, () => {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError.message);
      }
    });
  });
};
