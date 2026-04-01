import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { slackUsers } from '@/db/schema';

export const teamJoinHandler: EventLazyHandler<'team_join', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const userId = payload.user.id;

  try {
    // ユーザをデータベースに登録
    await env.DB.insert(slackUsers).values({
      slackUserId: userId,
    });
  } catch (error) {
    console.error('Failed to insert user into database:', error);
    await context.client.chat.postMessage({
      channel: userId,
      text: 'Welcome! :tada:\nユーザの登録に失敗しました。管理者に連絡してください',
    });
    return;
  }

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
