import type { MessageAckResponse, SlackRequestWithRespond, SlashCommand } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { isAdminUser } from '@/lib/is-admin-user';

/** 管理者のみ実行可能 */
export const adminOnlyCommand = (handler: (req: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => Promise<MessageAckResponse>) =>
  async (req: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => {
    const { context, payload } = req;

    const userId = payload.user_id;

    const isAdmin = await isAdminUser(context.client, userId);

    if (!isAdmin) {
      await context.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: userId,
        text: ':x: このコマンドは管理者のみ実行できます',
      });
      return;
    }

    // OKなら本処理へ
    return handler(req);
  };
