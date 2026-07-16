import { getMessage } from '@/utils';

const noticeModal = document.getElementById('notice') as HTMLDialogElement;
const noticeModalText = document.getElementById('notice-text') as HTMLParagraphElement;
const okButton = document.getElementById('notice-close') as HTMLButtonElement;

noticeModal.ariaLabel = getMessage('dialog_notice');
noticeModal.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    e.preventDefault();
    noticeModal.close();
  }
});

okButton.addEventListener('click', () => {
  noticeModal.close();
});

export const showNoticeModal = (taskName: string) => {
  const textContent = getMessage(`dialog_${taskName}`);

  noticeModalText.textContent = '';
  noticeModalText.insertAdjacentHTML('afterbegin', textContent.replaceAll('\n', '<br>'));
  noticeModal.showModal();
  noticeModal.focus();
};
