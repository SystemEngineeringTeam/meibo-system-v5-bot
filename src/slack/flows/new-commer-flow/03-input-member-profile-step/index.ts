import type { InferInput } from 'valibot';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { memberDetailSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { getTriggerId } from '@/slack/lib/get-trigger-id';
import { MeiboApiService } from '@/slack/lib/meibo-api-service';
import { toSlackErrors } from '@/slack/lib/to-slack-error';

export const inputMemberProfileStep = async (userId: string, selectedValue: string, selectMemberTypeTimestamp: string, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
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
  // TODO: API から取得したユーザ情報を返す
  data: InferInput<typeof memberDetailSchema>;
}

interface CreateMemberDetailResultFailure {
  success: false;
  errors: Record<string, string>;
}

export const createMemberDetail = async (slackUserId: string, inputValues: NormalizedViewState, env: HonoSlackAppEnv): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
  const memberDetail = safeParse(memberDetailSchema, inputValues);

  if (!memberDetail.success) {
    return {
      success: false,
      errors: toSlackErrors(memberDetail.issues),
    };
  }

  try {
    await MeiboApiService.putMemberDetail(slackUserId, memberDetail.output, { env });
    return {
      success: true,
      data: memberDetail.output,
    };
  } catch (error) {
    console.error('Failed to create member detail:', error);
    return {
      success: false,
      errors: {
        warning_divider: '部員情報の登録に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};
