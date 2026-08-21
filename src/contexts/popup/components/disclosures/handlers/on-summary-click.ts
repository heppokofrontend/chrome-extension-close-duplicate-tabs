import { checkIsValidDetailsElement } from '@/contexts/popup/components/disclosures/utils';
import { DETAILS_OPEN_STATUS_KEYS, STATE } from '@/contexts/popup/state';

const setTimeoutIdMap = new WeakMap<HTMLElement, number>();

export const onSummaryClick = (e: MouseEvent) => {
  const summaryElement = e.currentTarget;

  if (!(summaryElement instanceof HTMLElement)) {
    return;
  }

  const detailsElement = summaryElement.parentElement;

  if (!checkIsValidDetailsElement(detailsElement)) {
    return;
  }

  const isOpen = !detailsElement.open;
  const disclosureOpenStatusKey = DETAILS_OPEN_STATUS_KEYS[detailsElement.id];

  clearTimeout(setTimeoutIdMap.get(summaryElement));

  STATE.disclosureOpenStatus[disclosureOpenStatusKey] = isOpen;
  void chrome.storage.local.set({ disclosureOpenStatus: STATE.disclosureOpenStatus });

  if (isOpen) {
    const setTimeoutId = setTimeout(() => {
      summaryElement.scrollIntoView({
        block: 'start',
        behavior: 'smooth',
      });
    }, 200);

    setTimeoutIdMap.set(summaryElement, setTimeoutId);
  }
};
