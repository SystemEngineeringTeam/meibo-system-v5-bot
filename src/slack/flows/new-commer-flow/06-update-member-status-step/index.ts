import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { getNotifyChannelId } from '@/slack/lib/get-notify-channel-id';
import { kv } from '@/utils/kv';

export const updateMemberStatusStep = async (payerSlackUserId: string, approverSlackUserId: string, timestamp: string, approve: boolean, teamId: string | undefined, context: SlackAppContext, env: HonoSlackAppEnv) => {
  const notifyChannelId = await getNotifyChannelId(teamId, env);

  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, payerSlackUserId);
  if (!channelData) {
    console.error(`No channel data found for user ${payerSlackUserId}`);
    return;
  }

  // TODO: API を叩いてユーザのステータスを更新する

  try {
    await Promise.all([
      // 承認・拒否の結果をスレッドで送信
      await context.client.chat.postMessage({
        channel: notifyChannelId,
        thread_ts: timestamp,
        text: generateTextForApprover(approverSlackUserId, approve),
      }),

      // 承認・拒否のリアクションを追加
      await context.client.reactions.add({
        channel: notifyChannelId,
        timestamp,
        name: approve ? 'white_check_mark' : 'no_entry_sign',
      }),
      // 既存のリアクションを削除
      await context.client.reactions.remove({
        channel: notifyChannelId,
        timestamp,
        name: approve ? 'no_entry_sign' : 'white_check_mark',
      }),

      // 承認・拒否の結果をユーザに送信
      await context.client.chat.postMessage({
        channel: channelData.channelId,
        text: generateTextForMember(approverSlackUserId, approve),
        mrkdwn: true,
      }),
    ]);
  } catch (error) {
    console.error('Failed to send confirmation message:', error);
  }
};

function generateTextForApprover(approverSlackUserId: string, approve: boolean): string {
  if (approve) return `:white_check_mark: <@${approverSlackUserId}> が承認しました`;
  return `:no_entry_sign: <@${approverSlackUserId}> が拒否しました`;
}

function generateTextForMember(approverSlackUserId: string, approve: boolean): string {
  if (approve) {
    return `:white_check_mark: *承認申請が承認されました* :tada:
承認者: <@${approverSlackUserId}>

これで部員登録は完了です
Slack の氏名・表示名を *Slack について* を参考に変更してください

以下のドキュメントを確認してください
- <https://esa-pages.io/p/sharing/19973/posts/1147/e6d8aec55770714a4f06.html|Slack について>
- <https://esa-pages.io/p/sharing/19973/posts/1146/216834dd9c19648530e8.html|esa について>
- <https://esa-pages.io/p/sharing/19973/posts/277/123a21aedf1490ef8f71.html|Discord について>`;
  }

  return `:no_entry_sign: *承認申請が拒否されました*
拒否者: <@${approverSlackUserId}>

誤りの場合は役員に確認してください`;
}
