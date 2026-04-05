import type { SlackAPIClient } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { kv } from '@/utils/kv';

/**
 * DMチャンネルのIDを取得する．なければ新規にDMチャンネルを作成し，そのIDを返す
 */
export const getOrOpenDMChannelId = async (slackUserId: string, client: SlackAPIClient, env: HonoSlackAppEnv): Promise<string> => {
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);
  if (channelData) return channelData.channelId;

  // DM を開く
  const im = await client.conversations.open({ users: slackUserId });

  const channelId = im.channel?.id;
  if (!channelId) throw new Error('No channel ID');

  // KV にユーザーIDとチャンネルIDを保存
  await kv.put<ChannelData>(env.CHANNEL_KV, slackUserId, { channelId });

  return channelId;
};

export const getDMChannelId = async (slackUserId: string, env: HonoSlackAppEnv): Promise<string | null> => {
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);

  if (!channelData) return null;

  return channelData.channelId;
};
