import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { MeiboApiService } from '@/lib/meibo-api-service';
import { closeSelectMemberTypeMessage } from '@/slack/flows/new-commer-flow/02-select-member-type-step';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';

export const createNewcomerMember = async (slackUserId: string, validMemberInfo: ValiedMemberInfo, selectMemberTypeTimestamp: string, { env, client }: SlackHandlerOptions): Promise<boolean> => {
  try {
    const res = await MeiboApiService.putMemberDetail(slackUserId, validMemberInfo, { env });
    if (!res.data) {
      console.error('Failed to update member detail', { slackUserId, validMemberInfo, response: res });
      return false;
    }

    await selectFeePayeeStep(slackUserId, res.data, { env, client });
    await closeSelectMemberTypeMessage(slackUserId, selectMemberTypeTimestamp, { client, env });

    return true;
  } catch (error) {
    console.error('Failed to update member detail:', error);
    return false;
  }
};
