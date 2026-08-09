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

const SECOND_MS = 1_000;
const MINUTE_MS = 60_000;
const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;

const formatLastAccessed = (lastAccessed: number, now = Date.now()) => {
  const diffMs = Math.max(0, now - lastAccessed);

  if (diffMs < MINUTE_MS) {
    return getMessage('duplicates_last_accessed_seconds', String(Math.floor(diffMs / SECOND_MS)));
  }

  if (diffMs < HOUR_MS) {
    return getMessage('duplicates_last_accessed_minutes', String(Math.floor(diffMs / MINUTE_MS)));
  }

  if (diffMs < DAY_MS) {
    const hours = Math.floor(diffMs / HOUR_MS);
    const minutes = Math.floor((diffMs % HOUR_MS) / MINUTE_MS);

    return getMessage('duplicates_last_accessed_hours', [String(hours), String(minutes)]);
  }

  const days = Math.floor(diffMs / DAY_MS);
  const hours = Math.floor((diffMs % DAY_MS) / HOUR_MS);

  return getMessage('duplicates_last_accessed_days', [String(days), String(hours)]);
};

export const buildTableRow = (tbody: HTMLTableSectionElement, tab: TabWithIdAndUrl) => {
  const openTabLabel = getMessage('duplicates_open_tab', String(tab.id));
  const closeTabLabel = getMessage('duplicates_close_tab', tab.title ?? String(tab.id));
  const closedMessage = getMessage('duplicates_already_closed');
  const lastAccessedLabel =
    tab.lastAccessed === undefined ? '' : formatLastAccessed(tab.lastAccessed);

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
      <td class="last-accessed">${escapeHtml(lastAccessedLabel)}</td>
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
