export * from './show-confirm-modals';
export * from './show-notice-modal';

// ESCキーはpopup自体を閉じてしまうため、ダイアログ内では無効化する
document.querySelectorAll<HTMLDialogElement>('dialog').forEach((dialog) => {
  dialog.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
    }
  });
});
