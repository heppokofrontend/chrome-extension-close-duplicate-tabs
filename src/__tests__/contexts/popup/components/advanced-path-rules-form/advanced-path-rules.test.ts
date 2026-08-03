import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSaveData, type PathRule, type SaveDataType } from '@/utils';

const { STATE, save } = vi.hoisted(() => {
  return {
    STATE: { saveData: {}, editingOriginBeforeValue: '' },
    save: vi.fn(),
  };
});

vi.mock('@/contexts/popup/state', () => ({ STATE, save }));

type MutableSaveData = Required<SaveDataType>;

const getState = () =>
  STATE as unknown as {
    saveData: MutableSaveData;
    currentTabOrigin: string | null;
    editingOriginBeforeValue: string;
  };
const getSave = () =>
  save as unknown as ReturnType<typeof vi.fn<(patch: Partial<SaveDataType>) => void>>;

const FIXTURE_HTML = `
  <div id="advanced-path-rules__custom-rules"></div>
  <datalist id="advanced-path-rules__datalist"></datalist>

  <template id="advanced-path-rule-template">
    <section class="advanced-path-rule">
      <div class="advanced-path-rules__header">
        <h3 class="advanced-path-rules__heading"></h3>
        <p>
          <input
            type="text"
            class="advanced-path-rules__origin"
            aria-label="Origin"
            placeholder="http://localhost:3000"
            list="advanced-path-rules__datalist"
          />
        </p>
      </div>

      <ul class="advanced-path-rules__actions">
        <li>
          <label for="">pathname</label>
          <span>
            <input id="" type="checkbox" class="advanced-path-rules__pathname" />
          </span>
        </li>
        <li>
          <div class="advanced-path-rules__query-control">
            <label for="">query</label>
            <span>
              <input id="" type="checkbox" class="advanced-path-rules__query" />
            </span>
          </div>

          <div class="advanced-path-rules__allowed-query-params-item">
            <label for="">loading...</label>
            <span>
              <input
                id=""
                type="text"
                class="advanced-path-rules__allowed-query-params"
                placeholder="a, b"
              />
            </span>
          </div>
        </li>
        <li>
          <label for="">hash</label>
          <span>
            <input id="" type="checkbox" class="advanced-path-rules__hash" />
          </span>
        </li>
      </ul>

      <p class="advanced-path-rules__delete">
        <button type="button" class="advanced-path-rules__delete-button">Delete</button>
      </p>
    </section>
  </template>
  <p><button type="button" id="advanced-path-rules__add">Add</button></p>
`;

const requireElement = (root: ParentNode, selector: string): HTMLElement => {
  const found = root.querySelector(selector);

  if (!(found instanceof HTMLElement)) {
    throw new TypeError(`element not found: ${selector}`);
  }

  return found;
};

const requireInput = (root: ParentNode, selector: string): HTMLInputElement => {
  const found = requireElement(root, selector);

  if (!(found instanceof HTMLInputElement)) {
    throw new TypeError(`input not found: ${selector}`);
  }

  return found;
};

const first = <T>(items: T[]): T => {
  const [item] = items;

  if (item === undefined) {
    throw new Error('array is empty');
  }

  return item;
};

const clickAddButton = () => {
  requireElement(document, '#advanced-path-rules__add').dispatchEvent(new Event('click'));
};

const setChecked = (root: ParentNode, selector: string, checked: boolean) => {
  const checkbox = requireInput(root, selector);

  checkbox.checked = checked;
  checkbox.dispatchEvent(new Event('change', { bubbles: true }));
};

const setOriginValue = (root: ParentNode, value: string) => {
  const originInput = requireInput(root, '.advanced-path-rules__origin');

  originInput.value = value;
  originInput.dispatchEvent(new Event('input', { bubbles: true }));
};

const changeOriginValue = (root: ParentNode, value: string) => {
  const originInput = requireInput(root, '.advanced-path-rules__origin');

  originInput.value = value;
  originInput.dispatchEvent(new Event('change', { bubbles: true }));
};

const getLastSavedAdvancedPathRules = (): Record<string, PathRule> => {
  const lastPatch = getSave().mock.lastCall?.[0];

  return lastPatch?.advancedPathRules ?? {};
};

const MESSAGES: Record<string, string> = {
  aria_advancedPathRuleOrigin: 'Origin',
  aria_advancedPathRuleField: "$1's $2",
  text_advancedPathRuleUnsetOrigin: 'not set',
  btn_advancedPathRuleDelete: 'Delete',
  label_advancedPathRuleAllowedQueryParams: 'Query params to keep',
};

const stubGetMessage = (key: string, substitutions?: string | string[]) => {
  const template = MESSAGES[key] ?? key;
  const subs = Array.isArray(substitutions) ? substitutions : substitutions ? [substitutions] : [];

  return subs.reduce<string>(
    (message, sub, index) => message.replaceAll(`$${index + 1}`, sub),
    template,
  );
};

beforeEach(() => {
  vi.resetModules();
  save.mockClear();
  getState().saveData = structuredClone(defaultSaveData);
  getState().currentTabOrigin = null;
  getState().editingOriginBeforeValue = '';
  document.body.innerHTML = FIXTURE_HTML;
  vi.stubGlobal('chrome', { i18n: { getMessage: stubGetMessage } });
});

describe('addAdvancedPathRuleListeners', () => {
  it('adds a new rule section inheriting Default (ignorePathname/Query/Hash) as initial values', async () => {
    getState().saveData.ignorePathname = true;
    getState().saveData.ignoreQuery = false;
    getState().saveData.ignoreHash = true;

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();

    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const [key, rule] = first(Object.entries(getLastSavedAdvancedPathRules()));

    expect(rule).toStrictEqual({
      origin: '',
      pathname: true,
      query: false,
      hash: true,
      allowedQueryParams: '',
    });
    expect(requireInput(section, '.advanced-path-rules__pathname').checked).toBe(true);
    expect(requireInput(section, '.advanced-path-rules__hash').checked).toBe(true);
    expect(section.dataset['key']).toBe(key);
  });

  it('shows the unset-origin placeholder in the heading when origin is empty', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireElement(section, 'h3').textContent).toBe('not set');

    setOriginValue(section, 'https://example.com');
    expect(requireElement(section, 'h3').textContent).toBe('https://example.com');

    setOriginValue(section, '');
    expect(requireElement(section, 'h3').textContent).toBe('not set');
  });

  it('generates a unique key per click so multiple rules can coexist', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();

    clickAddButton();
    clickAddButton();

    const keys = [...document.querySelectorAll<HTMLElement>('.advanced-path-rule')].map(
      (section) => section.dataset['key'],
    );

    expect(keys).toHaveLength(2);
    expect(new Set(keys).size).toBe(2);
  });

  it('updates the heading and checkbox aria-labels live as the origin input changes', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    setOriginValue(section, 'https://example.com');

    expect(requireElement(section, 'h3').textContent).toBe('https://example.com');
    expect(
      requireElement(section, '.advanced-path-rules__pathname').getAttribute('aria-label'),
    ).toBe("https://example.com's pathname");
    expect(requireElement(section, '.advanced-path-rules__hash').getAttribute('aria-label')).toBe(
      "https://example.com's hash",
    );
  });

  it('persists origin and checkbox edits under the same key, merging into advancedPathRules', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    // save() は自身の中で STATE.saveData を更新しないため、テスト側で反映してやる必要がある。
    getSave().mockImplementation((patch) => {
      if (patch.advancedPathRules) {
        getState().saveData.advancedPathRules = patch.advancedPathRules;
      }
    });

    const section = requireElement(document, '.advanced-path-rule');
    const key = section.dataset['key'];

    if (!key) {
      throw new TypeError('key not found');
    }

    setOriginValue(section, 'https://example.com');
    setChecked(section, '.advanced-path-rules__pathname', true);

    expect(getState().saveData.advancedPathRules[key]).toStrictEqual({
      origin: 'https://example.com',
      pathname: true,
      query: false,
      hash: false,
      allowedQueryParams: '',
    });
  });

  it('removes the row from the DOM and from advancedPathRules on delete', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://a.example', pathname: false, query: false, hash: false },
      k2: { origin: 'https://b.example', pathname: true, query: true, hash: true },
    };

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(2);

    const target = requireElement(document, '[data-key="k1"]');
    requireElement(target, '.advanced-path-rules__delete-button').dispatchEvent(
      new Event('click', { bubbles: true }),
    );

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(1);
    expect(document.querySelector('[data-key="k1"]')).toBeNull();
    expect(Object.keys(getLastSavedAdvancedPathRules())).toStrictEqual(['k2']);
  });

  it('throws when the template is missing a required element (delete button)', async () => {
    const template = document.querySelector('#advanced-path-rule-template');

    if (!(template instanceof HTMLTemplateElement)) {
      throw new TypeError('template not found');
    }

    requireElement(template.content, '.advanced-path-rules__delete-button').remove();

    const { buildRuleSection } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/build-rule-section');

    expect(() =>
      buildRuleSection('k1', {
        origin: '',
        pathname: false,
        query: false,
        hash: false,
        allowedQueryParams: '',
      }),
    ).toThrow(TypeError);
  });

  it('uses the current tab origin as the origin input placeholder when available', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireInput(section, '.advanced-path-rules__origin').placeholder).toBe(
      'https://www.google.com',
    );
  });

  it('keeps the template placeholder when the current tab origin is unavailable', async () => {
    getState().currentTabOrigin = null;

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireInput(section, '.advanced-path-rules__origin').placeholder).toBe(
      'http://localhost:3000',
    );
  });

  it('links the origin input to the shared datalist and seeds an option matching the current tab origin', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const originInput = requireInput(section, '.advanced-path-rules__origin');
    const datalist = requireElement(document, '#advanced-path-rules__datalist');

    expect(originInput.getAttribute('list')).toBe('advanced-path-rules__datalist');
    expect(
      [...datalist.querySelectorAll<HTMLOptionElement>('option')].map((option) => option.value),
    ).toStrictEqual(['https://www.google.com']);
  });

  it('does not seed a datalist option when the current tab origin is unavailable', async () => {
    getState().currentTabOrigin = null;

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const originInput = requireInput(section, '.advanced-path-rules__origin');
    const datalist = requireElement(document, '#advanced-path-rules__datalist');

    expect(originInput.getAttribute('list')).toBe('advanced-path-rules__datalist');
    expect(datalist.querySelectorAll('option')).toHaveLength(0);
  });

  it('shares a single datalist across multiple rows instead of one per row', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();

    clickAddButton();
    clickAddButton();

    const originInputs = [
      ...document.querySelectorAll<HTMLInputElement>('.advanced-path-rules__origin'),
    ];

    expect(document.querySelectorAll('datalist')).toHaveLength(1);
    expect(originInputs.map((input) => input.getAttribute('list'))).toStrictEqual([
      'advanced-path-rules__datalist',
      'advanced-path-rules__datalist',
    ]);
  });

  it('seeds datalist options from currentTabOrigin followed by input history, deduped', async () => {
    getState().currentTabOrigin = 'https://www.google.com';
    getState().saveData.inputHistory = {
      advancedPathRuleOrigin: ['https://a.example', 'https://www.google.com', 'https://b.example'],
    };

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();
    clickAddButton();

    const datalist = requireElement(document, '#advanced-path-rules__datalist');

    expect(
      [...datalist.querySelectorAll<HTMLOptionElement>('option')].map((option) => option.value),
    ).toStrictEqual(['https://www.google.com', 'https://a.example', 'https://b.example']);
  });

  it('adds the pre-edit value back into the datalist on focusin, so an accidental overwrite is recoverable', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://old.example', pathname: false, query: false, hash: false },
    };

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();

    const section = requireElement(document, '.advanced-path-rule');
    const originInput = requireInput(section, '.advanced-path-rules__origin');
    originInput.dispatchEvent(new Event('focusin', { bubbles: true }));

    const datalist = requireElement(document, '#advanced-path-rules__datalist');

    expect(
      [...datalist.querySelectorAll<HTMLOptionElement>('option')].map((option) => option.value),
    ).toContain('https://old.example');
  });

  it('saves the origin to inputHistory on change but not on input alone', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    setOriginValue(section, 'https://example.com');
    expect(getSave().mock.calls.some(([patch]) => 'inputHistory' in patch)).toBe(false);

    changeOriginValue(section, 'https://example.com');
    expect(getSave()).toHaveBeenCalledWith({
      inputHistory: { advancedPathRuleOrigin: ['https://example.com'] },
    });
  });

  it('does not save inputHistory when the origin is changed to an empty value', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    changeOriginValue(section, '');

    expect(getSave().mock.calls.some(([patch]) => 'inputHistory' in patch)).toBe(false);
  });

  it('sets the allowed-query-params label text from i18n instead of leaving the template placeholder', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const label = requireElement(section, '.advanced-path-rules__allowed-query-params-item label');

    expect(label.textContent).toBe('Query params to keep');
  });

  it('saves the allowed query params value on input, merging into advancedPathRules', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/components/advanced-path-rules-form/effects');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const allowedQueryParamsInput = requireInput(
      section,
      '.advanced-path-rules__allowed-query-params',
    );

    allowedQueryParamsInput.value = 'a, b';
    allowedQueryParamsInput.dispatchEvent(new Event('input', { bubbles: true }));

    expect(getLastSavedAdvancedPathRules()[String(section.dataset['key'])]).toMatchObject({
      allowedQueryParams: 'a, b',
    });
  });
});

describe('renderAdvancedPathRules', () => {
  it('restores origin, checkbox state and heading from an already-stored advancedPathRules', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://foo.example', pathname: true, query: false, hash: true },
    };

    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireElement(section, 'h3').textContent).toBe('https://foo.example');
    expect(requireInput(section, '.advanced-path-rules__origin').value).toBe('https://foo.example');
    expect(requireInput(section, '.advanced-path-rules__pathname').checked).toBe(true);
    expect(requireInput(section, '.advanced-path-rules__query').checked).toBe(false);
    expect(requireInput(section, '.advanced-path-rules__hash').checked).toBe(true);
  });

  it('restores the allowed query params value from an already-stored advancedPathRules', async () => {
    getState().saveData.advancedPathRules = {
      k1: {
        origin: 'https://foo.example',
        pathname: false,
        query: true,
        hash: false,
        allowedQueryParams: 'a, b',
      },
    };

    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/components/advanced-path-rules-form/renderers/render-advanced-path-rules');
    renderAdvancedPathRules();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireInput(section, '.advanced-path-rules__allowed-query-params').value).toBe('a, b');
  });
});
