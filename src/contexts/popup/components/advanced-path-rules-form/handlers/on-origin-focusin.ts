import { renderDatalist } from '@/contexts/popup/components/advanced-path-rules-form/renderers/render-datalist';
import { STATE } from '@/contexts/popup/state';

export const onOriginFocusIn = (e: Event) => {
  if (!(e.currentTarget instanceof HTMLInputElement)) {
    return;
  }

  if (e.currentTarget.value) {
    STATE.editingOriginBeforeValue = e.currentTarget.value;
    renderDatalist();
  }
};
