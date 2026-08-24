import { describe, it, expect, vi, afterEach } from 'vitest';

import { createChromeTabStub } from '@/__tests__/__helpers__';
import { runReload } from '@/contexts/worker/features/reload';
import type { SaveDataType } from '@/utils';

const saveData: SaveDataType = { includeAllWindow: false, includePinnedTabs: false };

afterEach(() => {
  vi.unstubAllGlobals();
});

describe('runReload', () => {
  it('reloads every tab that has a numeric id', async () => {
    const tabs = [
      createChromeTabStub({ id: 1 }),
      createChromeTabStub({ id: 2 }),
      createChromeTabStub({ id: undefined }),
    ];
    const query = vi.fn().mockResolvedValue(tabs);
    const reload = vi.fn();
    vi.stubGlobal('chrome', { tabs: { query, reload } });

    await runReload({ saveData });

    expect(query).toHaveBeenCalledWith({
      windowType: 'normal',
      currentWindow: true,
      pinned: false,
    });
    expect(reload.mock.calls).toStrictEqual([[1], [2]]);
  });

  it('does nothing when there are no tabs to reload', async () => {
    const query = vi.fn().mockResolvedValue([]);
    const reload = vi.fn();
    vi.stubGlobal('chrome', { tabs: { query, reload } });

    await runReload({ saveData });

    expect(reload).not.toHaveBeenCalled();
  });
});
