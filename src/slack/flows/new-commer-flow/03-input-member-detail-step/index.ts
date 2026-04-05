import type { ButtonAction, MessageBlockAction, SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { sendInputMemberDetailModal } from '@slack/flows/shared/send-input-member-detail-modal';
import { memberDetailSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { toSlackErrors } from '@/slack/lib/to-slack-error';

export const inputMemberDetailStep = async (userId: string, selectedValue: string, selectMemberTypeTimestamp: string, context: SlackAppContext, payload: MessageBlockAction<ButtonAction>, env: HonoSlackAppEnv) => {
  const channelId = await getOrOpenDMChannelId(userId, context.client, env);

  if (!context.triggerId) {
    await context.client.chat.postMessage({
      channel: channelId,
      text: ':warning: 部員情報モーダルの表示に失敗しました。管理者に連絡してください。',
    });
    return;
  }

  await sendInputMemberDetailModal(selectedValue, 'input_newcomer_member_detail', context.triggerId, selectMemberTypeTimestamp, context.client);
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

export const createMemberDetail = async (inputValues: NormalizedViewState): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
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
        warning_divider: '部員情報の登録に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};
