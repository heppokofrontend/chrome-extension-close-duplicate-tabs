import { getMessage } from '@/utils';

const noticeModal = document.getElementById('notice') as HTMLDialogElement;
const noticeModalText = document.getElementById('notice-text') as HTMLParagraphElement;
const okButton = document.getElementById('notice-close') as HTMLButtonElement;

noticeModal.ariaLabel = getMessage('dialog_notice');
noticeModal.addEventListener('close', () => {
  noticeModalText.textContent = '';
});

okButton.addEventListener('click', () => {
  noticeModal.close();
});

interface Params {
  message: string;
}

export const showNoticeModal = ({ message }: Params) => {
  noticeModalText.insertAdjacentHTML('afterbegin', message.replaceAll('\n', '<br>'));
  noticeModal.showModal();
  noticeModal.focus();
};
