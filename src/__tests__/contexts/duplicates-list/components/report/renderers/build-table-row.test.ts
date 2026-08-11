import { describe, it, expect, vi, afterEach } from 'vitest';

import { buildTableRow } from '@/contexts/duplicates-list/components/report/renderers/build-table-row';
import type { TabWithIdAndUrl } from '@/types';

const makeTab = (overrides: Partial<TabWithIdAndUrl> = {}): TabWithIdAndUrl => ({
  id: 1,
  url: 'https://example.com/',
  windowId: 1,
  index: 0,
  pinned: false,
  highlighted: false,
  active: false,
  frozen: false,
  incognito: false,
  selected: false,
  discarded: false,
  autoDiscardable: true,
  groupId: -1,
  ...overrides,
});

type RuntimeStub = { lastError: { message: string } | undefined };

const stubChrome = () => {
  const runtime: RuntimeStub = { lastError: undefined };
  const tabsUpdate = vi.fn(
    (_tabId: number, _opts: chrome.tabs.UpdateProperties, cb: () => void) => {
      cb();
    },
  );
  const tabsRemove = vi.fn((_tabId: number, cb: () => void) => {
    cb();
  });
  const windowsUpdate = vi.fn(
    (_windowId: number, _opts: chrome.windows.UpdateInfo, cb: () => void) => {
      cb();
    },
  );
  const getMessage = vi.fn((key: string, substitutions?: string | string[]) => {
    const subs = substitutions === undefined ? [] : ([] as string[]).concat(substitutions);
    const [first = '', second = ''] = subs;

    switch (key) {
      case 'duplicates_open_tab':
        return 'open tab';
      case 'duplicates_close_tab':
        return 'close tab';
      case 'duplicates_already_closed':
        return 'already closed';
      case 'duplicates_last_accessed_seconds':
        return `${first} seconds ago`;
      case 'duplicates_last_accessed_minutes':
        return `${first} minutes ago`;
      case 'duplicates_last_accessed_hours':
        return `${first} hours ${second} minutes ago`;
      case 'duplicates_last_accessed_days':
        return `${first} days ${second} hours ago`;
      default:
        return `${key}:${String(substitutions)}`;
    }
  });

  vi.stubGlobal('chrome', {
    runtime,
    tabs: { update: tabsUpdate, remove: tabsRemove },
    windows: { update: windowsUpdate },
    i18n: { getMessage },
  });

  return { runtime, mocks: { tabsUpdate, tabsRemove, windowsUpdate, getMessage } };
};

const render = (tab: TabWithIdAndUrl) => {
  const tbody = document.createElement('tbody');
  buildTableRow(tbody, tab);

  return {
    tr: tbody.querySelector('tr'),
    openButton: tbody.querySelector<HTMLButtonElement>('th button'),
    closeButton: tbody.querySelector<HTMLButtonElement>('td.close button'),
    status: tbody.querySelector<HTMLElement>('.status'),
    lastAccessed: tbody.querySelector<HTMLElement>('.last-accessed'),
  };
};

describe('buildTableRow', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  it('renders the tab id, title, and both buttons', () => {
    stubChrome();

    const { tr, openButton, closeButton } = render(
      makeTab({ id: 42, title: '<script>alert(1)</script>' }),
    );

    expect(tr?.querySelector('.title div')?.textContent).toBe('<script>alert(1)</script>');
    expect(tr?.querySelector('.title')?.innerHTML).not.toContain('<script>');
    expect(openButton?.getAttribute('aria-label')).toBe('open tab');
    expect(closeButton?.getAttribute('aria-label')).toBe('42: close tab');
  });

  it('focuses the tab and its window when the open button succeeds', () => {
    const { mocks } = stubChrome();
    const { openButton } = render(makeTab({ id: 5, windowId: 9 }));

    openButton?.click();

    expect(mocks.tabsUpdate).toHaveBeenCalledWith(5, { active: true }, expect.any(Function));
    expect(mocks.windowsUpdate).toHaveBeenCalledWith(9, { focused: true }, expect.any(Function));
  });

  it('marks the row as already-closed when the open button fails', () => {
    const { runtime, mocks } = stubChrome();
    runtime.lastError = { message: 'No tab with id: 5' };
    const { openButton, closeButton, tr, status } = render(makeTab({ id: 5 }));

    openButton?.click();

    expect(tr?.dataset['status']).toBe('already-closed');
    expect(openButton?.getAttribute('aria-disabled')).toBe('true');
    expect(closeButton?.getAttribute('aria-disabled')).toBe('true');
    expect(status?.textContent).toBe('already closed');
    expect(mocks.windowsUpdate).not.toHaveBeenCalled();
  });

  it('marks the row closed immediately and removes the tab when the close button is clicked', () => {
    const { mocks } = stubChrome();
    const { closeButton, openButton, tr, status } = render(makeTab({ id: 7 }));

    closeButton?.click();

    expect(tr?.dataset['status']).toBe('closed');
    expect(openButton?.getAttribute('aria-disabled')).toBe('true');
    expect(closeButton?.getAttribute('aria-disabled')).toBe('true');
    expect(status?.textContent).toBe('already closed');
    expect(mocks.tabsRemove).toHaveBeenCalledWith(7, expect.any(Function));
  });

  it('renders the last-accessed time in minutes when under an hour', () => {
    stubChrome();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-09T12:05:00Z'));

    const { lastAccessed } = render(
      makeTab({ lastAccessed: new Date('2026-08-09T12:00:00Z').getTime() }),
    );

    expect(lastAccessed?.textContent).toBe('5 minutes ago');
  });

  it('renders the last-accessed time combining hours and minutes when under a day', () => {
    stubChrome();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-09T14:15:00Z'));

    const { lastAccessed } = render(
      makeTab({ lastAccessed: new Date('2026-08-09T12:00:00Z').getTime() }),
    );

    expect(lastAccessed?.textContent).toBe('2 hours 15 minutes ago');
  });

  it('renders the last-accessed time combining days and hours when a day or more has passed', () => {
    stubChrome();
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-08-12T15:00:00Z'));

    const { lastAccessed } = render(
      makeTab({ lastAccessed: new Date('2026-08-09T12:00:00Z').getTime() }),
    );

    expect(lastAccessed?.textContent).toBe('3 days 3 hours ago');
  });

  it('renders an empty last-accessed cell when the tab has no lastAccessed value', () => {
    stubChrome();

    const { lastAccessed } = render(makeTab());

    expect(lastAccessed?.textContent).toBe('');
  });
});
