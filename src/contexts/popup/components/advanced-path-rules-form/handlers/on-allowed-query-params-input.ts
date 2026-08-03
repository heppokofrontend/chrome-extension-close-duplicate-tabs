import { patchRule } from '@/contexts/popup/components/advanced-path-rules-form/utils';

export const onAllowedQueryParamsInput = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  const key = e.currentTarget.dataset['key'] ?? '';

  if (key === '') {
    return;
  }

  patchRule(key, { allowedQueryParams: e.currentTarget.value });
};
