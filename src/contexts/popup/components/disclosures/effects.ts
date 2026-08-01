import { onSummaryClick } from '@/contexts/popup/components/disclosures/handlers';
import { checkIsValidDetailsElement } from '@/contexts/popup/components/disclosures/utils';
import { UI } from '@/contexts/popup/constants';
import { DETAILS_OPEN_STATUS_KEYS, STATE } from '@/contexts/popup/state';

export const initDetailsElements = () => {
  UI.details.forEach((detailsElement) => {
    const summaryElement = detailsElement.querySelector('summary');

    if (!checkIsValidDetailsElement(detailsElement)) {
      return;
    }

    const id = detailsElement.id;
    const detailsOpenStatusKey = DETAILS_OPEN_STATUS_KEYS[id];

    summaryElement?.addEventListener('click', onSummaryClick);

    detailsElement.open = STATE.dialogOpenStatus[detailsOpenStatusKey];
  });
};
