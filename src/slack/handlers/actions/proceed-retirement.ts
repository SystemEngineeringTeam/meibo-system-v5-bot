import type { BlockActionAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { retirementSelectedMemberStep } from '@/slack/flows/retirement-flow/02-retirement-selected-member-step';

export const proceedRetirementActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const teamId = context.teamId;
  const channelId = context.channelId;
  const userId = payload.user.id;
  const selectedMemberSlackId = payload.actions[0].value;

  try {
    // selectedMemberSlackId を返す
    await context.client.chat.postEphemeral({
      channel: channelId ?? await getNotifyChannelId(context.teamId, env),
      user: userId,
      text: `退部処理を進めるボタンが押されました。選択された部員のSlack ID: ${selectedMemberSlackId}`,
    });
    // await retirementSelectedMemberStep(teamId, channelId, userId, selectedMemberSlackId, { client: context.client, env });
  } catch (error) {
    console.error('Error in proceedRetirementActionHandler:', error);

    await context.client.chat.postEphemeral({
      channel: channelId ?? await getNotifyChannelId(context.teamId, env),
      user: payload.user.id,
      text: '退部処理の実行中にエラーが発生しました。管理者に連絡してください。',
    });
  }
};
