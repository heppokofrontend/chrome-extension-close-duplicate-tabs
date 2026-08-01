import { getMessage } from '@/utils';

export const headingTextFor = (origin: string) =>
  origin || getMessage('text_advancedPathRuleUnsetOrigin');
