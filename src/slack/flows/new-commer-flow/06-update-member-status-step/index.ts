import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { getNotifyChannelId } from '@/slack/lib/get-notify-channel-id';

export const updateMemberStatusStep = async (payerSlackUserId: string, approverSlackUserId: string, timestamp: string, approve: boolean, teamId: string | undefined, { client, env }: SlackHandlerOptions) => {
  const notifyChannelId = await getNotifyChannelId(teamId, env);

  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(payerSlackUserId, client, env);

  // TODO: API を叩いてユーザのステータスを更新する

  await Promise.allSettled([
    // 承認・拒否の結果をスレッドで送信
    client.chat.postMessage({
      channel: notifyChannelId,
      thread_ts: timestamp,
      text: generateTextForApprover(approverSlackUserId, approve),
    }),

    // 承認・拒否のリアクションを追加
    client.reactions.add({
      channel: notifyChannelId,
      timestamp,
      name: approve ? 'white_check_mark' : 'no_entry_sign',
    }),
    // 既存のリアクションを削除
    client.reactions.remove({
      channel: notifyChannelId,
      timestamp,
      name: approve ? 'no_entry_sign' : 'white_check_mark',
    }),

    // 承認・拒否の結果をユーザに送信
    client.chat.postMessage({
      channel: channelId,
      text: generateTextForMember(approverSlackUserId, approve),
      mrkdwn: true,
    }),
  ]);
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
