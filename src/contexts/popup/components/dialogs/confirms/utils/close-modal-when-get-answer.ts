import { POPUP_UI } from '@/contexts/popup/constants';

import { isModalOpen } from './open-modal';

/**
 * dialog.close() が発火する close イベントは非同期（キューイングされたタスク）なため、
 * ここで発火を待たずに次のモーダルを開くと、遅れて届いた close イベントが新しいモーダルの
 * close リスナー（handleClose によるDOMクリアや useAbortController の abort）を誤発火させる。
 * そのため実際に close イベントが処理されるまでこの Promise を解決しない。
 */
export const closeModalWhenGetAnswer = <V>(renderUIPromise: Promise<V>) =>
  renderUIPromise.finally(
    () =>
      new Promise<void>((resolve) => {
        if (!isModalOpen()) {
          resolve();
          return;
        }

        POPUP_UI.confirmModal.addEventListener(
          'close',
          () => {
            resolve();
          },
          { once: true },
        );
        POPUP_UI.confirmModal.close();
      }),
  );
