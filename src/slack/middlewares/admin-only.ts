import type { MessageAckResponse, SlackRequestWithRespond, SlashCommand } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';

export const adminOnlySlashCommand = (handler: (req: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => Promise<MessageAckResponse>) =>
  async (args: SlackRequestWithRespond<HonoSlackAppEnv, SlashCommand>) => {
    const { context, payload } = args;

    const userId = payload.user_id;

    // ユーザー情報取得
    const res = await context.client.users.info({
      user: userId,
    });

    const user = res.user;

    const isAdmin
      = user?.is_admin === true
        || user?.is_owner === true
        || user?.is_primary_owner === true;

    if (!isAdmin) {
      await context.client.chat.postEphemeral({
        channel: payload.channel_id,
        user: userId,
        text: ':no_entry: このコマンドは管理者のみ実行できます',
      });
      return;
    }

    // OKなら本処理へ
    return handler(args);
  };
