import { getMessage } from '@/utils';

const noticeModal = document.getElementById('notice') as HTMLDialogElement;
const noticeModalTitle = document.getElementById('notice-title') as HTMLParagraphElement;
const noticeModalText = document.getElementById('notice-text') as HTMLParagraphElement;
const okButton = document.getElementById('notice-close') as HTMLButtonElement;

const ref = {
  cleanup: undefined as undefined | (() => void),
};

noticeModal.addEventListener('close', () => {
  noticeModalText.textContent = '';
});

okButton.addEventListener('click', () => {
  noticeModal.close();
  ref.cleanup?.();
});

interface Params {
  title?: string;
  message: string;
  cleanup?: () => void;
}

export const showNoticeModal = ({ title = '', message, cleanup }: Params) => {
  ref.cleanup = cleanup;
  noticeModalTitle.textContent = title || getMessage('dialog_notice');
  noticeModalText.insertAdjacentHTML('afterbegin', message.replaceAll('\n', '<br>'));
  noticeModal.showModal();
  noticeModal.focus();
};
