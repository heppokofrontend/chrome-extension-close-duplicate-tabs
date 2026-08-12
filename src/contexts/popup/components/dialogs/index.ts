import { UI } from '@/contexts/popup/constants';
import { getMessage } from '@/utils';

export * from './show-confirm-modals';
export * from './show-notice-modal';

UI.confirmModal.ariaLabel = getMessage('dialog_confirm');

// ESCキーはpopup自体を閉じてしまうため、ダイアログ内では無効化する
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  });
});
