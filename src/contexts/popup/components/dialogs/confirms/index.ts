import { POPUP_UI } from '@/contexts/popup/constants';
import { getMessage } from '@/utils';

export * from './show-choices-modal';
export * from './show-confirm-modal';
export * from './show-categorize-modal';
export * from './show-select-modal';

POPUP_UI.confirmModal.ariaLabel = getMessage('dialog_confirm');
