import { POPUP_UI } from '@/contexts/popup/constants';
import { getMessage } from '@/utils';

export * from './show-confirm-modals';

POPUP_UI.confirmModal.ariaLabel = getMessage('dialog_confirm');
