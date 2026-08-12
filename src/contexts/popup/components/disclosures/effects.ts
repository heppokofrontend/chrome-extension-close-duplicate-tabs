import { POPUP_UI } from '@/contexts/popup/constants';
import { DETAILS_OPEN_STATUS_KEYS, STATE } from '@/contexts/popup/state';

import { onSummaryClick } from './handlers';
import { checkIsValidDetailsElement } from './utils';

export const initDetailsElements = () => {
  POPUP_UI.details.forEach((detailsElement) => {
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
