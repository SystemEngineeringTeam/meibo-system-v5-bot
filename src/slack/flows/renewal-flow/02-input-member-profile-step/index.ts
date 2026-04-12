import type { InferInput } from 'valibot';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { memberDetailSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getTriggerId } from '@/lib/get-trigger-id';
import { toSlackErrors } from '@/lib/to-slack-error';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';

export const confirmRegistrationStep = async (slackUserId: string, selectMemberTypeTimestamp: string, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });
  const validatedTriggerId = await getTriggerId(triggerId, channelId, client);

  // TODO: API からユーザ情報を取得して表示する
  const memberType = 'internal'; // 仮

  await sendInputMemberProfileModal(memberType, 'input_continuing_member_profile', validatedTriggerId, selectMemberTypeTimestamp, client);
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

export const updateMemberDetail = async (inputValues: NormalizedViewState): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
  const memberDetail = safeParse(memberDetailSchema, inputValues);

  if (!memberDetail.success) {
    return {
      success: false,
      errors: toSlackErrors(memberDetail.issues),
    };
  }

  try {
  // TODO: ユーザ詳細情報を作成する API を呼び出す
    return {
      success: true,
      data: memberDetail.output,
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
