import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { MeiboApiService } from '@/slack/lib/meibo-api-service';
import { kv } from '@/utils/kv';
import { startRegistrationStep } from '../01-start-registration-step';
import { sendSelectMemberTypeMessage } from '../02-select-member-type-step';
import { selectFeePayeeStep } from '../04-select-fee-payee-step';

export const recoveryNewCommerFlow = async (targetSlackUserId: string, currentChannelId: string, context: SlackAppContext, env: HonoSlackAppEnv) => {
  const step = await MeiboApiService.getMemberNewcommerStep(targetSlackUserId, { env });

  // STEP1 が完了していない場合
  if (step === 'BEFORE_CREATE') {
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
    await startRegistrationStep(targetSlackUserId, { client: context.client, env });

    return;
  }

  // DM チャンネルの作成
  const channelId = await getOrOpenDMChannelId(targetSlackUserId, { env, client: context.client });

  // DMチャンネルIDを保存
  await kv.put<ChannelData>(env.CHANNEL_KV, targetSlackUserId, { channelId });

  // STEP2 (POST /members) 後，
  if (step === 'CREATED') {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: '部員種別選択メッセージを再送します',
    });

    await sendSelectMemberTypeMessage(context.client, channelId);

    return;
  }

  // STEP3 (POST /member/:id/detail) 後
  if (step === 'DETAIL_SAVED' || true) {
    await context.client.chat.postEphemeral({
      channel: currentChannelId,
      user: targetSlackUserId,
      text: '部費の支払い相手選択メッセージを再送します',
    });

    await selectFeePayeeStep(targetSlackUserId, undefined, { client: context.client, env });

    return;
  }

  // 完了済み
  await context.client.chat.postEphemeral({
    channel: currentChannelId,
    user: targetSlackUserId,
    text: 'すでに登録が完了しています。対応は不要です',
  });
};
