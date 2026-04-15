import type { HonoSlackAppEnv } from '@/types/hono';
import type { InferResponseType } from '@/types/openapi';
import type { AfterInputMemberInfoQue } from '@/types/que';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { SlackViewStateInput } from '@/utils/normalize-slack-view-state';
import { memberSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getTriggerId } from '@/lib/get-trigger-id';
import { toSlackErrors } from '@/lib/to-slack-error';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';
import { que } from '@/utils/que';

export const inputMemberProfileStep = async (userId: string, selectedValue: 'INTERNAL' | 'EXTERNAL', selectMemberTypeTimestamp: string, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
  const channelId = await getOrOpenDMChannelId(userId, { client, env });
  const validTriggerId = await getTriggerId(triggerId, channelId, client);

  if (!triggerId) {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 部員情報モーダルの表示に失敗しました。管理者に連絡してください。',
    });
    return;
  }

  await sendInputMemberProfileModal(selectedValue, 'input_newcomer_member_detail', validTriggerId, selectMemberTypeTimestamp, client);
};

interface CreateMemberDetailResultSuccess {
  success: true;
  data: InferResponseType<'/members/_rpc/submit-info', 'post'>;
}

interface CreateMemberDetailResultFailure {
  success: false;
  errors: Record<string, string>;
}

export type CreateMemberDetailResult = CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure;

export const createMemberDetail = async (slackUserId: string, values: SlackViewStateInput, selectMemberTypeTimestamp: string, { env }: { env: HonoSlackAppEnv }): Promise<Record<string, string> | null> => {
  const normalizedValues = normalizeViewState(values);
  const memberDetail = safeParse(memberSchema, normalizedValues);

  if (!memberDetail.success) return toSlackErrors(memberDetail.issues);

  await que.send<AfterInputMemberInfoQue>(env.AFTER_INPUT_MEMBER_INFO_QUE, {
    type: 'newcommer',
    slackUserId,
    validMemberInfo: memberDetail.output,
    selectMemberTypeTimestamp,
  });

  return null;
};
