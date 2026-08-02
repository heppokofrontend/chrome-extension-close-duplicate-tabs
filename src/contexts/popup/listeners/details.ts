import { STATE } from '@/contexts/popup/utils/state';

const setTimeoutIdMap = new WeakMap<HTMLElement, number>();
const dialogOpenStatusKeys = {
  dangerZoneDetails: 'dangerZone',
  advancedPathRulesDetails: 'advancedPathRules',
} as const;

const isDetailsId = (id: string): id is keyof typeof dialogOpenStatusKeys =>
  id in dialogOpenStatusKeys;

export const initDetailsElements = () => {
  const detailsElements = document.querySelectorAll<HTMLDetailsElement>('details');

  detailsElements.forEach((detailsElement) => {
    const id = detailsElement.id;
    const summaryElement = detailsElement.querySelector('summary');

    if (!isDetailsId(id)) {
      return;
    }

    const dialogOpenStatusKey = dialogOpenStatusKeys[id];

    summaryElement?.addEventListener('click', () => {
      const isOpen = !detailsElement.open;

      clearTimeout(setTimeoutIdMap.get(summaryElement));

      STATE.dialogOpenStatus[dialogOpenStatusKey] = isOpen;
      void chrome.storage.local.set({ dialogOpenStatus: STATE.dialogOpenStatus });

      if (isOpen) {
        const setTimeoutId = setTimeout(() => {
          summaryElement.scrollIntoView({
            block: 'start',
            behavior: 'smooth',
          });
        }, 200);

        setTimeoutIdMap.set(summaryElement, setTimeoutId);
      }
    });

    detailsElement.open = STATE.dialogOpenStatus[dialogOpenStatusKey];
  });
};
