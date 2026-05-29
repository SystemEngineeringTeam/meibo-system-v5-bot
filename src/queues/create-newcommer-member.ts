import type { ValidMemberInfo } from '@/slack/schemas/member';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { MeiboApiService } from '@/lib/meibo-api-service';
import { closeSelectMemberTypeMessage } from '@/slack/flows/new-commer-flow/02-select-member-type-step';
import { selectFeePayeeStep } from '@/slack/flows/new-commer-flow/04-select-fee-payee-step';

export const createNewcomerMember = async (slackUserId: string, validMemberInfo: ValidMemberInfo, selectMemberTypeTimestamp: string, { env, client }: SlackHandlerOptions): Promise<boolean> => {
  try {
    const res = await MeiboApiService.putMemberInfoForRegister(slackUserId, validMemberInfo, { env });
    if (!res.data) {
      console.error('Failed to update member detail', { slackUserId, validMemberInfo, response: res });
      return false;
    }

    const info = {
      detail: res.data.value.detail,
      profile: res.data.value.profile,
    };

    await selectFeePayeeStep(slackUserId, info, { env, client });
    await closeSelectMemberTypeMessage(slackUserId, selectMemberTypeTimestamp, { client, env });

    return true;
  } catch (error) {
    console.error('Failed to update member detail:', error);
    return false;
  }
};
