import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { PayeeData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const setPayeeNicknameCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ payload, context, env }) => {
  const texts = payload.text.trim().split(' ');
  const nickname = texts.at(0);

  if (nickname === undefined) {
    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: ':x: コマンドの使用方法: `/set-payee-nickname <nickname>`',
    });
    return;
  }

  const existByNickname = await kv.get<PayeeData>(env.PAYEE_KV, nickname);
  if (existByNickname !== null) {
    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: ':x: そのニックネームは既に使用されています。別のニックネームを指定してください。',
    });
    return;
  }

  const payeeList = await env.PAYEE_KV.list();
  const payeeDataList = await Promise.all(payeeList.keys.map(async (key) => ({ nickname: key.name, ...await kv.get<PayeeData>(env.PAYEE_KV, key.name) })));
  const existByUserId = payeeDataList.find((data) => data?.slackUserId === payload.user_id);

  if (existByUserId) {
    await context.client.chat.postEphemeral({
      channel: payload.channel_id,
      user: payload.user_id,
      text: `:x: すでに登録されています (ニックネーム: ${existByUserId.nickname})`,
    });
    return;
  }

  await kv.put<PayeeData>(env.PAYEE_KV, nickname, { slackUserId: payload.user_id });

  await context.client.chat.postEphemeral({
    channel: payload.channel_id,
    user: payload.user_id,
    text: `:white_check_mark: 支払い先として登録しました（ニックネーム: ${nickname}）`,
  });
};
