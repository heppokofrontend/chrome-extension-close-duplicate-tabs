import { POPUP_UI } from '@/contexts/popup/constants';

export const closeModalWhenGetAnswer = <V>(renderUIPromise: Promise<V>) =>
  renderUIPromise.finally(() => {
    POPUP_UI.confirmModal.close();
  });
