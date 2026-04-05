import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData, UserData } from '@/types/kv';
import { kv } from '@/utils/kv';
import { startRegistrationStep } from '../01-start-registration-step';
import { sendSelectMemberTypeMessage } from '../02-select-member-type-step';
import { selectFeePayeeStep } from '../04-select-fee-payee-step';

export const recoveryNewCommerFlow = async (targetSlackUserId: string, currentChannelId: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  const userData = await kv.get<UserData>(env.USER_KV, targetSlackUserId);

  // STEP1 が完了していない場合
  if (!userData) {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: 'ログインURLを再発行します',
    });

    // 既存のデータを削除
    await Promise.all([
      env.LINK_KV.delete(targetSlackUserId),
      env.USER_KV.delete(targetSlackUserId),
    ]);

    // STEP1 を再度実行
    await startRegistrationStep(targetSlackUserId, context, env);

    return;
  }

  // DM チャンネルの作成
  const im = await context.client.conversations.open({
    users: targetSlackUserId,
  });
  const channelId = im.channel?.id;
  if (!channelId) {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: ':warning: DMチャンネルの作成に失敗しました',
    });

    return;
  }

  // DMチャンネルIDを保存
  await kv.put<ChannelData>(env.CHANNEL_KV, targetSlackUserId, { channelId });

  // TODO: API からメンバーのステータスを取得
  const user = undefined;

  // STEP2 (POST /members) 後，
  // eslint-disable-next-line ts/strict-boolean-expressions
  if (!user) {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: '部員種別選択メッセージを再送します',
    });

    await sendSelectMemberTypeMessage(context.client, channelId);

    return;
  }

  // STEP3 (POST /member/:id/detail) 後
  if (!user) {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: '部費の支払い相手選択メッセージを再送します',
    });

    await selectFeePayeeStep(targetSlackUserId, undefined, context, env);
  }

  // 完了済み
  await context.client.chat.postEphemeral({
    channel: currentChannelId,
    user: targetSlackUserId,
    text: 'すでに登録が完了しています。対応は不要です',
  });
};
