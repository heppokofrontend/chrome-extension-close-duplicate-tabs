import { beforeEach, describe, expect, it, vi } from 'vitest';

const { STATE } = vi.hoisted(() => {
  const STATE: {
    saveData: { inputHistory: Partial<Record<string, string[]>> };
    currentTabOrigin: string | null;
    editingOriginBeforeValue: string;
  } = {
    saveData: { inputHistory: {} },
    currentTabOrigin: null,
    editingOriginBeforeValue: '',
  };

  return { STATE };
});

vi.mock('@/contexts/popup/state', () => ({ STATE }));

beforeEach(() => {
  vi.resetModules();
  STATE.saveData.inputHistory = {};
  STATE.currentTabOrigin = null;
  STATE.editingOriginBeforeValue = '';
  document.body.innerHTML = '<datalist id="advanced-path-rules__datalist"></datalist>';
});

const importRenderDatalist = async () => {
  const { renderDatalist } =
    await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-datalist');

  return renderDatalist;
};

const getOptionValues = () =>
  [...document.querySelectorAll<HTMLOptionElement>('#advanced-path-rules__datalist option')].map(
    (option) => option.value,
  );

describe('renderDatalist', () => {
  it('renders nothing when there is no candidate', async () => {
    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual([]);
  });

  it('seeds currentTabOrigin followed by input history', async () => {
    STATE.currentTabOrigin = 'https://www.google.com';
    STATE.saveData.inputHistory['advancedPathRuleOrigin'] = [
      'https://a.example',
      'https://b.example',
    ];

    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual([
      'https://www.google.com',
      'https://a.example',
      'https://b.example',
    ]);
  });

  it('keeps editingOriginBeforeValue recoverable when there is no currentTabOrigin', async () => {
    STATE.editingOriginBeforeValue = 'https://old.example';

    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual(['https://old.example']);
  });

  it('puts currentTabOrigin first even when editingOriginBeforeValue is set', async () => {
    STATE.editingOriginBeforeValue = 'https://old.example';
    STATE.currentTabOrigin = 'https://www.google.com';
    STATE.saveData.inputHistory['advancedPathRuleOrigin'] = ['https://b.example'];

    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual([
      'https://www.google.com',
      'https://old.example',
      'https://b.example',
    ]);
  });

  it('dedupes editingOriginBeforeValue against currentTabOrigin and history', async () => {
    STATE.editingOriginBeforeValue = 'https://a.example';
    STATE.currentTabOrigin = 'https://www.google.com';
    STATE.saveData.inputHistory['advancedPathRuleOrigin'] = [
      'https://a.example',
      'https://b.example',
    ];

    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual([
      'https://www.google.com',
      'https://a.example',
      'https://b.example',
    ]);
  });

  it('ignores an empty editingOriginBeforeValue', async () => {
    STATE.editingOriginBeforeValue = '';
    STATE.saveData.inputHistory['advancedPathRuleOrigin'] = ['https://a.example'];

    const renderDatalist = await importRenderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual(['https://a.example']);
  });

  it('clears previously rendered options instead of accumulating duplicates', async () => {
    STATE.saveData.inputHistory['advancedPathRuleOrigin'] = ['https://a.example'];

    const renderDatalist = await importRenderDatalist();
    renderDatalist();
    renderDatalist();

    expect(getOptionValues()).toStrictEqual(['https://a.example']);
  });
});
