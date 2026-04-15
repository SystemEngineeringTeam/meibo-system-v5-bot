import type { ValiedMemberInfo } from '@/slack/schemas/member';

export interface AfterInputMemberInfoQue {
  type: 'newcommer' | 'renewal';
  slackUserId: string;
  validMemberInfo: ValiedMemberInfo;
  selectMemberTypeTimestamp?: number;
}
