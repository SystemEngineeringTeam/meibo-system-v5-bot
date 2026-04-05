import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { InferInput } from 'valibot';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { sendInputMemberDetailModal } from '@slack/flows/shared/send-input-member-detail-modal';
import { memberDetailSchema } from '@slack/schemas/member';
import { safeParse } from 'valibot';
import { toSlackErrors } from '@/slack/lib/to-slack-error';
import { kv } from '@/utils/kv';

export const confirmRegistrationStep = async (slackUserId: string, selectMemberTypeTimestamp: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);
  if (!channelData) {
    await context.client.chat.postEphemeral({
      channel: slackUserId,
      user: slackUserId,
      text: ':warning: DMチャンネルIDの取得に失敗しました。管理者に連絡してください。',
    });
    return;
  }

  if (!context.triggerId) {
    await context.client.chat.postMessage({
      channel: channelData.channelId,
      text: ':warning: 部員情報モーダルの表示に失敗しました。管理者に連絡してください。',
    });
    return;
  }

  // TODO: API からユーザ情報を取得して表示する
  const memberType = 'internal'; // 仮

  await sendInputMemberDetailModal(memberType, 'input_continuing_member_detail', context.triggerId, selectMemberTypeTimestamp, context.client);
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
