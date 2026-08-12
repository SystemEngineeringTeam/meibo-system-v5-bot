import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { RetrieveFlaggedMembersQue } from '@/types/que';
import { que } from '@/utils/que';

export const retrieveFlaggedMembersCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const teamId = payload.team_id;
  const channelId = payload.channel_id;
  const userId = payload.user_id;

  try {
    await que.send<RetrieveFlaggedMembersQue>(env.RETRIEVE_FLAGGED_MEMBERS_QUE, { teamId, channelId, userId });
    await context.client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '退部候補の部員を取得しています。しばらくお待ちください。',
    });
  } catch (error) {
    console.error('Error occurred while enqueueing retrieve flagged members job:', error);
  }
};
