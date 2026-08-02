import type { TabWithIdAndUrl } from '@/types';

import { buildTabRow } from './build-tab-row';

const THEAD_SRC = `
  <thead>
    <tr>
      <th scope="col">Tab ID</th>
      <th scope="col">Title</th>
    </tr>
  </thead>
`;

export const buildUrlSection = (url: string, tabs: TabWithIdAndUrl[], closedMessage: string) => {
  const section = document.createElement('div');
  const heading = document.createElement('h2');
  heading.textContent = url;

  const table = document.createElement('table');
  const tbody = document.createElement('tbody');

  for (const tab of tabs) {
    buildTabRow(tbody, tab, closedMessage);
  }

  table.insertAdjacentHTML('beforeend', THEAD_SRC);
  table.appendChild(tbody);
  section.appendChild(heading);
  section.appendChild(table);

  return section;
};
