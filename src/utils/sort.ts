import type { SortType } from '../constants';

export interface SortableTab {
  id: number;
  hostname: string;
  url: string;
  title: string;
  pinned: boolean;
  windowId: number;
}

export const compareByUrl = (a: SortableTab, b: SortableTab) => {
  if (a.url < b.url) {
    return -1;
  }

  if (a.url > b.url) {
    return 1;
  }

  return 0;
};

export const compareByTitle = (a: SortableTab, b: SortableTab) => {
  if (a.title < b.title) {
    return -1;
  }

  if (a.title > b.title) {
    return 1;
  }

  return 0;
};

export const compareByHostAndTitle = (a: SortableTab, b: SortableTab) => {
  if (a.hostname < b.hostname) {
    return -1;
  }

  if (a.hostname > b.hostname) {
    return 1;
  }

  if (a.title < b.title) {
    return -1;
  }

  if (a.title > b.title) {
    return 1;
  }

  return 0;
};

export const getSorter = (sort: SortType | undefined) => {
  if (sort === 'sortByUrl') {
    return compareByUrl;
  }

  if (sort === 'sortByTitle') {
    return compareByTitle;
  }

  return compareByHostAndTitle;
};
