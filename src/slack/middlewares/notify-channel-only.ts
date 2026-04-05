import type { MessageAckResponse, SlackRequestWithRespond, SlashCommand } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getNotifyChannelId } from '../lib/get-notify-channel-id';

/** 通知チャンネルでのみ実行可能 */
export const notifyChannelOnlyCommand = (handler: (req: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => Promise<MessageAckResponse>) =>
  async (req: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => {
    const { payload, context, env } = req;

    const notifyChannelId = await getNotifyChannelId(payload.team_id, env);

    if (notifyChannelId !== payload.channel_id) {
      await context.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: payload.user_id,
        text: `:x: このコマンドは通知チャンネル (<#${notifyChannelId}>) でのみ実行できます`,
      });
      return;
    }

    // OKなら本処理へ
    return handler(req);
  };
