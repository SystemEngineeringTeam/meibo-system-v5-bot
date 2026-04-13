import type { HonoSlackAppEnv } from '@/types/hono';
import type { InferResponseType } from '@/types/openapi';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { memberSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { apiClient } from '@/lib/fetche-client';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getTriggerId } from '@/lib/get-trigger-id';
import { getUserId } from '@/lib/get-user-id';
import { MeiboApiService } from '@/lib/meibo-api-service';
import { toSlackErrors } from '@/lib/to-slack-error';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';

export const confirmRegistrationStep = async (slackUserId: string, selectMemberTypeTimestamp: string, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });
  const userId = await getUserId(slackUserId, { client, env });
  const validatedTriggerId = await getTriggerId(triggerId, channelId, client);

  const memberDetailRes = await apiClient.GET('/members/{publicId}/detail', {
    params: { path: { publicId: userId } },
  });
  if (!memberDetailRes.data) {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 部員情報の取得に失敗しました。管理者に連絡してください。',
    });
    return;
  }
  const memberType = memberDetailRes.data.value.type === 'ACTIVE' ? memberDetailRes.data.value.active.type : undefined;
  if (!memberType) {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 継続手続きは現役部員のみが操作可能です。誤りだと思われる場合は役員に連絡してください。',
    });
    return;
  }

  await sendInputMemberProfileModal(memberType, 'input_continuing_member_profile', validatedTriggerId, selectMemberTypeTimestamp, client);
};

interface CreateMemberDetailResultSuccess {
  success: true;
  data: InferResponseType<'/members/_rpc/submit-info', 'post'>;
}

interface CreateMemberDetailResultFailure {
  success: false;
  errors: Record<string, string>;
}

export const updateMemberDetail = async (slackUserId: string, inputValues: NormalizedViewState, { env }: { env: HonoSlackAppEnv }): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
  const memberDetail = safeParse(memberSchema, inputValues);

  if (!memberDetail.success) {
    return {
      success: false,
      errors: toSlackErrors(memberDetail.issues),
    };
  }

  try {
    const res = await MeiboApiService.putMemberDetail(slackUserId, memberDetail.output, { env });
    if (res.data) return { success: true, data: res.data };

    return {
      success: false,
      errors: {
        warning_divider: '部員情報の登録に失敗しました。時間をおいて再度お試しください。',
      },
    };
  } catch (error) {
    console.error('Failed to create member detail:', error);
    return {
      success: false,
      errors: {
        warning_divider: '部員情報の更新に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};
