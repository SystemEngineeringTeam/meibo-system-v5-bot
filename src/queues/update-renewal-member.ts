import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { MeiboApiService } from '@/lib/meibo-api-service';
import { closeContinuationMessage } from '@/slack/flows/renewal-flow/01-start-renewal-step';
import { selectFeePayeeStep } from '@/slack/flows/renewal-flow/03-select-fee-payee-step';

export const updateRenewalMember = async (slackUserId: string, validMemberInfo: ValiedMemberInfo, selectMemberTypeTimestamp: string | undefined, { env, client }: SlackHandlerOptions): Promise<boolean> => {
  try {
    const res = await MeiboApiService.putMemberDetail(slackUserId, validMemberInfo, { env });
    if (!res.data) {
      console.error('Failed to update member detail', { slackUserId, validMemberInfo, response: res });
      return false;
    }

    await selectFeePayeeStep(slackUserId, res.data, { env, client });
    if (selectMemberTypeTimestamp) await closeContinuationMessage(slackUserId, selectMemberTypeTimestamp, { client, env });

    return true;
  } catch (error) {
    console.error('Failed to update member detail:', error);
    return false;
  }
};
