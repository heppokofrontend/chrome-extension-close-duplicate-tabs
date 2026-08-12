import { UI } from '@/contexts/popup/constants';

export const closeModalWhenGetAnswer = <V>(renderUIPromise: Promise<V>) =>
  renderUIPromise.finally(() => {
    UI.confirmModal.close();
  });
