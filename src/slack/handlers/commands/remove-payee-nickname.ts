import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { PayeeData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const removePayeeNicknameCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const texts = payload.text.trim().split(' ');
  const nickname = texts.at(0);

  // ニックネームが指定されていない場合は自分のニックネームを削除する
  if (nickname === '' || nickname === undefined) {
    const payeeList = await env.PAYEE_KV.list();
    const payeeDataList = await Promise.all(payeeList.keys.map(async (key) => ({ nickname: key.name, ...await kv.get<PayeeData>(env.PAYEE_KV, key.name) })));
    const existByUserId = payeeDataList.find((data) => data?.slackUserId === payload.user_id);

    if (!existByUserId) {
      await context.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: payload.user_id,
        text: ':x: 登録されていません',
      });
      return;
    }

    await env.PAYEE_KV.delete(existByUserId.nickname);

    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:white_check_mark: ニックネーム「${existByUserId.nickname}」を削除しました`,
    });
  } else {
    const targetNickname = await kv.get<PayeeData>(env.PAYEE_KV, nickname);
    if (targetNickname === null) {
      await context.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: payload.user_id,
        text: ':x: そのニックネームは使用されていません。登録されているニックネームを指定してください。',
      });
      return;
    }

    await env.PAYEE_KV.delete(nickname);

    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:white_check_mark: ニックネーム「${nickname}」を削除しました`,
    });
  }
};
