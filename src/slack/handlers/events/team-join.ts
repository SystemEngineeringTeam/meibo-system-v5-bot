import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';

export const teamJoinHandler: EventLazyHandler<'team_join', HonoSlackAppEnv> = async ({ context, payload }) => {
  const userId = payload.user.id;

  // TODO: ユーザを登録

  try {
    // DM を開く
    const im = await context.client.conversations.open({
      users: userId,
    });

    const channelId = im.channel?.id;
    if (!channelId) throw new Error('No channel ID');

    // メッセージを送信
    await context.client.chat.postMessage({
      channel: channelId,
      text: 'Welcome! :tada:',
    });
  } catch (error) {
    console.error('Failed to send welcome DM:', error);
  }
};
