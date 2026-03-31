import type { EventLazyHandler, SlackEdgeAppEnv } from 'slack-cloudflare-workers';

export const teamJoinHandler: EventLazyHandler<'team_join', SlackEdgeAppEnv> = async ({ context, payload }) => {
  const userId = payload.user.id;

  try {
    // DM を開く
    const im = await context.client.conversations.open({
      users: userId,
    });

    const channelId = im.channel?.id;
    if (channelId === undefined) throw new Error('No channel ID');

    // メッセージを送信
    await context.client.chat.postMessage({
      channel: channelId,
      text: 'Welcome! :tada:',
    });
  } catch (error) {
    console.error('Failed to send welcome DM:', error);
  }
};
