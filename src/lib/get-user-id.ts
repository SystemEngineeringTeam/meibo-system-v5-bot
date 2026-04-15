import type { UserData } from '@/types/kv';
import type { OptionalClientSlackHandlerOptions } from '@/types/slack-handler-options';
import { kv } from '@/utils/kv';
import { apiClient } from './fetche-client';

export const getUserId = async (slackUserId: string, { client, env }: OptionalClientSlackHandlerOptions) => {
  // KV からユーザIDを取得
  const userData = await kv.get<UserData>(env.USER_KV, slackUserId);
  if (userData) return userData.userId;

  // なければ API から取得
  const memberInfo = await apiClient.GET('/members/_rpc/find-member', {
    params: { query: {
      by: 'slackId',
      value: slackUserId,
    } },
  });
  if (memberInfo.data) {
    const userId = memberInfo.data.value.publicId;
    await kv.put<UserData>(env.USER_KV, slackUserId, { userId });
    return userId;
  }

  await client?.chat.postEphemeral({
    channel: slackUserId,
    user: slackUserId,
    text: 'ユーザーID が見つかりませんでした。管理者に連絡してください',
  });
  throw new Error('ユーザーID が見つかりませんでした');
};
