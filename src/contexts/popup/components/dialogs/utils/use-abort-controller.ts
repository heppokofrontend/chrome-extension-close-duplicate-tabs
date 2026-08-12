import { POPUP_UI } from '@/contexts/popup/constants';

export const useAbortController = (resolver: () => void) => {
  const controller = new AbortController();
  const { signal } = controller;

  const cleanUp = () => {
    signal.removeEventListener('abort', resolver);
    POPUP_UI.confirmModal.removeEventListener('close', onClose);
  };
  const onClose = () => {
    controller.abort();
    cleanUp();
  };

  POPUP_UI.confirmModal.addEventListener('close', onClose);
  signal.addEventListener('abort', resolver);

  return {
    cleanUp,
  };
};
