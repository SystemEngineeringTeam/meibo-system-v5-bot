import type { ValiedMemberInfo } from '@/slack/schemas/member';

interface NewcommerAfterInputMemberInfoQue {
  type: 'newcommer';
  slackUserId: string;
  validMemberInfo: ValiedMemberInfo;
  selectMemberTypeTimestamp: string;
}

interface RenewalAfterInputMemberInfoQue {
  type: 'renewal';
  slackUserId: string;
  validMemberInfo: ValiedMemberInfo;
  selectMemberTypeTimestamp?: string;
}

export type AfterInputMemberInfoQue = NewcommerAfterInputMemberInfoQue | RenewalAfterInputMemberInfoQue;
