type ValidTab = chrome.tabs.Tab & {
  id: number;
  url: string;
};

chrome.storage.local.get('saveData', ({ saveData }: { saveData: SaveDataType }) => {
  document.body.dataset.includeAllWindow = String(saveData.includeAllWindow ?? false);
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
  const typedDuplicatedEntries = duplicatedEntries as [string, ValidTab[]][];
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
      tbody.insertAdjacentHTML(
        'afterbegin',
        `
        <tr>
          <th scope="row"><button type="button" aria-label="${tab.id}を開く">
            <span>${tab.id}</span>
            <img src="./images/open.svg" />
          </button></th>
          <td class="title">
            <div>${tab.title}</div>
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
            tr.dataset.closed = 'true';
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

render();
