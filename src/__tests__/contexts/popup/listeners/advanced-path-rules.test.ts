import { beforeEach, describe, expect, it, vi } from 'vitest';

import { defaultSaveData, type PathRule, type SaveDataType } from '@/utils';

const { STATE, save } = vi.hoisted(() => {
  return {
    STATE: { saveData: {} },
    save: vi.fn(),
  };
});

vi.mock('@/contexts/popup/utils/state', () => ({ STATE, save }));

type MutableSaveData = Required<SaveDataType>;

const getState = () =>
  STATE as unknown as { saveData: MutableSaveData; currentTabOrigin: string | null };
const getSave = () =>
  save as unknown as ReturnType<typeof vi.fn<(patch: Partial<SaveDataType>) => void>>;

const FIXTURE_HTML = `
  <div id="advanced-path-rules__custom-rules"></div>

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
          />
          <datalist></datalist>
        </p>
      </div>

      <ul>
        <li>
          <label for="">pathname</label>
          <span>
            <input id="" type="checkbox" class="advanced-path-rules__pathname" />
          </span>
        </li>
        <li>
          <label for="">query</label>
          <span>
            <input id="" type="checkbox" class="advanced-path-rules__query" />
          </span>
        </li>
        <li>
          <label for="">hash</label>
          <span>
            <input id="" type="checkbox" class="advanced-path-rules__hash" />
          </span>
        </li>
        <li>
          <button type="button" class="advanced-path-rules__delete">Delete</button>
        </li>
      </ul>
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

const getLastSavedAdvancedPathRules = (): Record<string, PathRule> => {
  const lastPatch = getSave().mock.lastCall?.[0];

  return lastPatch?.advancedPathRules ?? {};
};

const MESSAGES: Record<string, string> = {
  aria_advancedPathRuleOrigin: 'Origin',
  aria_advancedPathRuleField: "$1's $2",
  text_advancedPathRuleUnsetOrigin: 'not set',
  btn_advancedPathRuleDelete: 'Delete',
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
  document.body.innerHTML = FIXTURE_HTML;
  vi.stubGlobal('chrome', { i18n: { getMessage: stubGetMessage } });
});

describe('addAdvancedPathRuleListeners', () => {
  it('adds a new rule section inheriting Default (ignorePathname/Query/Hash) as initial values', async () => {
    getState().saveData.ignorePathname = true;
    getState().saveData.ignoreQuery = false;
    getState().saveData.ignoreHash = true;

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();

    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const [key, rule] = first(Object.entries(getLastSavedAdvancedPathRules()));

    expect(rule).toStrictEqual({ origin: '', pathname: true, query: false, hash: true });
    expect(requireInput(section, '.advanced-path-rules__pathname').checked).toBe(true);
    expect(requireInput(section, '.advanced-path-rules__hash').checked).toBe(true);
    expect(section.dataset['key']).toBe(key);
  });

  it('shows the unset-origin placeholder in the heading when origin is empty', async () => {
    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
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
      await import('@/contexts/popup/listeners/advanced-path-rules');
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
      await import('@/contexts/popup/listeners/advanced-path-rules');
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
      await import('@/contexts/popup/listeners/advanced-path-rules');
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
    });
  });

  it('removes the row from the DOM and from advancedPathRules on delete', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://a.example', pathname: false, query: false, hash: false },
      k2: { origin: 'https://b.example', pathname: true, query: true, hash: true },
    };

    const { renderAdvancedPathRules, addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    renderAdvancedPathRules();
    addAdvancedPathRuleListeners();

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(2);

    const target = requireElement(document, '[data-key="k1"]');
    requireElement(target, '.advanced-path-rules__delete').dispatchEvent(
      new Event('click', { bubbles: true }),
    );

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(1);
    expect(document.querySelector('[data-key="k1"]')).toBeNull();
    expect(Object.keys(getLastSavedAdvancedPathRules())).toStrictEqual(['k2']);
  });

  it('does nothing when the rule template is missing from the DOM', async () => {
    requireElement(document, '#advanced-path-rule-template').remove();

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(0);
  });

  it('does nothing when the template is missing a required element (delete button)', async () => {
    const template = document.querySelector('#advanced-path-rule-template');

    if (!(template instanceof HTMLTemplateElement)) {
      throw new TypeError('template not found');
    }

    requireElement(template.content, '.advanced-path-rules__delete').remove();

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(0);
  });

  it('uses the current tab origin as the origin input placeholder when available', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
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
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireInput(section, '.advanced-path-rules__origin').placeholder).toBe(
      'http://localhost:3000',
    );
  });

  it('links the origin input to its datalist via id/list and seeds an option matching the placeholder', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const originInput = requireInput(section, '.advanced-path-rules__origin');
    const datalist = requireElement(section, 'datalist');

    expect(originInput.getAttribute('list')).toBe(datalist.id);
    expect(datalist.id).not.toBe('');
    expect(
      [...datalist.querySelectorAll<HTMLOptionElement>('option')].map((option) => option.value),
    ).toStrictEqual(['https://www.google.com']);
  });

  it('links id/list per row without seeding an option when the current tab origin is unavailable', async () => {
    getState().currentTabOrigin = null;

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    const section = requireElement(document, '.advanced-path-rule');
    const originInput = requireInput(section, '.advanced-path-rules__origin');
    const datalist = requireElement(section, 'datalist');

    expect(originInput.getAttribute('list')).toBe(datalist.id);
    expect(datalist.querySelectorAll('option')).toHaveLength(0);
  });

  it('gives each row a unique datalist id so multiple rules do not collide', async () => {
    getState().currentTabOrigin = 'https://www.google.com';

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();

    clickAddButton();
    clickAddButton();

    const datalistIds = [...document.querySelectorAll('datalist')].map((datalist) => datalist.id);

    expect(datalistIds).toHaveLength(2);
    expect(new Set(datalistIds).size).toBe(2);
  });

  it('does nothing when the add button is clicked and the custom-rules container is missing', async () => {
    requireElement(document, '#advanced-path-rules__custom-rules').remove();

    const { addAdvancedPathRuleListeners } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    addAdvancedPathRuleListeners();
    clickAddButton();

    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(0);
    expect(getSave()).not.toHaveBeenCalled();
  });
});

describe('renderAdvancedPathRules', () => {
  it('restores origin, checkbox state and heading from an already-stored advancedPathRules', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://foo.example', pathname: true, query: false, hash: true },
    };

    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/listeners/advanced-path-rules');
    renderAdvancedPathRules();

    const section = requireElement(document, '.advanced-path-rule');

    expect(requireElement(section, 'h3').textContent).toBe('https://foo.example');
    expect(requireInput(section, '.advanced-path-rules__origin').value).toBe('https://foo.example');
    expect(requireInput(section, '.advanced-path-rules__pathname').checked).toBe(true);
    expect(requireInput(section, '.advanced-path-rules__query').checked).toBe(false);
    expect(requireInput(section, '.advanced-path-rules__hash').checked).toBe(true);
  });

  it('does nothing when the custom-rules container is missing', async () => {
    getState().saveData.advancedPathRules = {
      k1: { origin: 'https://foo.example', pathname: true, query: false, hash: true },
    };
    requireElement(document, '#advanced-path-rules__custom-rules').remove();

    const { renderAdvancedPathRules } =
      await import('@/contexts/popup/listeners/advanced-path-rules');

    expect(() => {
      renderAdvancedPathRules();
    }).not.toThrow();
    expect(document.querySelectorAll('.advanced-path-rule')).toHaveLength(0);
  });
});
