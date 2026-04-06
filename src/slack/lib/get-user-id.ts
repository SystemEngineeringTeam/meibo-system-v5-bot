import type { UserData } from '@/types/kv';
import type { OptionalClientSlackHandlerOptions } from '@/types/slack-handler-options';
import { kv } from '@/utils/kv';

export const getUserId = async (slackUserId: string, { client, env }: OptionalClientSlackHandlerOptions) => {
  const userData = await kv.get<UserData>(env.USER_KV, slackUserId);
  if (!userData) {
    await client?.chat.postEphemeral({
      channel: slackUserId,
      user: slackUserId,
      text: 'ユーザーID が見つかりませんでした。管理者に連絡してください',
    });
    throw new Error('ユーザーID が見つかりませんでした');
  }
  return userData.userId;
};
