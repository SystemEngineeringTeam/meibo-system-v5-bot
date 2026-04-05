import type { SlackAPIClient } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { UserData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const getUserId = async (slackUserId: string, client: SlackAPIClient, env: HonoSlackAppEnv) => {
  const userId = await kv.get<UserData>(env.USER_KV, slackUserId);
  if (!userId) {
    await client.chat.postEphemeral({
      channel: slackUserId,
      user: slackUserId,
      text: 'ユーザーID が見つかりませんでした。管理者に連絡してください',
    });
  }
  return userId;
};
