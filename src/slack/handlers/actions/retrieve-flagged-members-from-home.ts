import type { BlockAction, BlockActionAckHandler, ButtonAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { RetrieveFlaggedMembersQue } from '@/types/que';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { que } from '@/utils/que';

export const retrieveFlaggedMembersFromHomeActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, BlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  const teamId = context.teamId;
  const userId = payload.user.id;

  try {
    const channelId = await getNotifyChannelId(teamId, env);

    await que.send<RetrieveFlaggedMembersQue>(env.RETRIEVE_FLAGGED_MEMBERS_QUE, { teamId: teamId ?? '', channelId, userId });
    await context.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '要確認の部員を取得しています。しばらくお待ちください。',
    });
  } catch (error) {
    console.error('Error occurred while enqueueing retrieve flagged members job from home:', error);
  }
};
