import type { ValidMemberInfo } from '@/slack/schemas/member';

interface NewcommerAfterInputMemberInfoQue {
  type: 'newcommer';
  slackUserId: string;
  validMemberInfo: ValidMemberInfo;
  selectMemberTypeTimestamp: string;
}

interface RenewalAfterInputMemberInfoQue {
  type: 'renewal';
  slackUserId: string;
  validMemberInfo: ValidMemberInfo;
  selectMemberTypeTimestamp?: string;
}

export type AfterInputMemberInfoQue = NewcommerAfterInputMemberInfoQue | RenewalAfterInputMemberInfoQue;
