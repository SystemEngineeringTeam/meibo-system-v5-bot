import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData, LinkData } from '@/types/kv';
import { v4 as uuidv4 } from 'uuid';
import { kv } from '@/utils/kv';

export const startRegistrationStep = async (slackUserId: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザIDと紐づく一意なキー
  const key = uuidv4();
  await kv.put<LinkData>(env.LINK_KV, key, { slackUserId });

  // ログインURLを生成
  const loginUrl = new URL('/login', env.SLACK_BOT_BASE_URL!);
  loginUrl.searchParams.set('key', key);

  try {
    // DM を開く
    const im = await context.client.conversations.open({
      users: slackUserId,
    });

    const channelId = im.channel?.id;
    if (!channelId) throw new Error('No channel ID');

    await Promise.all([
      // KV にユーザーIDとチャンネルIDを保存
      kv.put<ChannelData>(env.CHANNEL_KV, slackUserId, { channelId }),

      // メッセージを送信
      context.client.chat.postMessage({
        channel: channelId,
        text: generateText(loginUrl),
        mrkdwn: true,
      }),
    ]);
  } catch (error) {
    console.error('Failed to send welcome DM:', error);
  }
};

function generateText(loginUrl: URL): string {
  return `*【重要】部員登録をしてください* – 名簿管理システム

*STEP 1: 下記リンクより Gmail アカウントを紐づけてください
ログインURL: ${loginUrl.toString()}

※このURLは一時的なもので、他の人と共有しないでください。`;
}
