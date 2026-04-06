import type { Dayjs } from 'dayjs';
import type { ChannelData, LinkData } from '@/types/kv';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import dayjs from 'dayjs';
import { v4 as uuidv4 } from 'uuid';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { kv } from '@/utils/kv';

export const startRegistrationStep = async (slackUserId: string, { client, env }: SlackHandlerOptions) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });
  // ユーザIDと紐づく一意なキー
  const key = uuidv4();

  const expiration = dayjs().add(10, 'minute').second(59); // 10分で期限切れ
  await kv.put<LinkData>(env.LINK_KV, key, { slackUserId }, { expiration: expiration.unix() });

  // ログインURLを生成
  const loginUrl = new URL('/login', env.SLACK_BOT_BASE_URL!);
  loginUrl.searchParams.set('key', key);

  await Promise.allSettled([
    // KV にユーザーIDとチャンネルIDを保存
    kv.put<ChannelData>(env.CHANNEL_KV, slackUserId, { channelId }),

    // メッセージを送信
    client.chat.postMessage({
      channel: channelId,
      text: generateText(loginUrl, expiration),
      mrkdwn: true,
    }),
  ]);
};

function generateText(loginUrl: URL, expiration: Dayjs): string {
  return `*【重要】部員登録をしてください* – 名簿管理システム

[部員登録の流れ]
  STEP 1: Emailアドレスの紐づけ（このステップ）
  STEP 2: 部員種別の選択(内部生/外部生)
  STEP 3: 部員情報の入力
  STEP 4: 部費の支払い相手の選択
    ↓ 承認待ち
  部員登録完了 :tada:

*STEP 1: 下記リンクより Email アカウントを紐づけてください
ログインURL: ${loginUrl.toString()}
有効期限: 10分 (${expiration.format('MM/DD HH:mm')})

※このURLは一時的なもので、他の人と共有しないでください。`;
}
