import { isDetailsOpenStatusKey } from '@/contexts/popup/components/disclosures/utils/type-guard';
import type { DetailsOpenStatusKey } from '@/contexts/popup/state';

export const checkIsValidDetailsElement = (
  detailsElement: EventTarget | null,
): detailsElement is HTMLDetailsElement & {
  id: DetailsOpenStatusKey;
} => {
  if (!(detailsElement instanceof HTMLElement)) {
    return false;
  }

  const id = detailsElement.id;

  if (!isDetailsOpenStatusKey(id)) {
    return false;
  }

  return true;
};
