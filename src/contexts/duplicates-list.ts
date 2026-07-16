import { getSaveData } from '@/utils';

type ValidTab = chrome.tabs.Tab & {
  id: number;
  url: string;
};

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

void getSaveData().then((saveData) => {
  document.body.dataset['includeAllWindow'] = String(saveData.includeAllWindow);
});

const render = async () => {
  const { lastWindowId } = await chrome.storage.session.get('lastWindowId');

  const returnButton = document.querySelector('#return button');
  returnButton?.addEventListener('click', () => {
    if (typeof lastWindowId === 'number') {
      chrome.windows.update(lastWindowId, { focused: true }, () => {
        if (chrome.runtime.lastError) {
          alert(chrome.i18n.getMessage('duplicates_already_closed'));
          return;
        }
      });
    }
  });

  const { duplicatedEntries } = await chrome.storage.session.get('duplicatedEntries');
  const typedDuplicatedEntries: [string, ValidTab[]][] = Array.isArray(duplicatedEntries)
    ? (duplicatedEntries as [string, ValidTab[]][])
    : [];
  const container = document.querySelector('#container');
  const fragment = document.createDocumentFragment();
  const theadSrc = `
    <thead>
      <tr>
        <th scope="col">Tab ID</th>
        <th scope="col">Title</th>
      </tr>
    </thead>
  `;
  const closedMessage = chrome.i18n.getMessage('duplicates_already_closed');

  for (const [url, tabs] of typedDuplicatedEntries) {
    const section = document.createElement('div');
    const heading = document.createElement('h2');
    heading.textContent = url;

    const table = document.createElement('table');
    const tbody = document.createElement('tbody');

    for (const tab of tabs) {
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
              return;
            }
          });
        });
      });
    }

    table.insertAdjacentHTML('beforeend', theadSrc);
    table.appendChild(tbody);
    section.appendChild(heading);
    section.appendChild(table);
    fragment.appendChild(section);
  }

  container?.appendChild(fragment);
};

void render();
