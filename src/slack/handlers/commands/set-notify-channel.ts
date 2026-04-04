import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { SettingsData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const setNotifyChannelCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ context, payload, env }) => {
  await kv.put<SettingsData>(env.SETTINGS_KV, payload.team_id, {
    notifyChannelId: payload.channel_id,
  });

  await context.client.chat.postMessage({
    channel: payload.channel_id,
    text: `<#${payload.channel_id}> が名簿管理BOTの通知チャンネルに設定されました！`,
  });
};
