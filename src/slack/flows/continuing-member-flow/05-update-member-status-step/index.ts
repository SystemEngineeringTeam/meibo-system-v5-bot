import type { ButtonAction, MessageBlockAction, SlackAppContext } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { getNotifyChannelId } from '@/slack/lib/get-notify-channel-id';

export const updateMemberStatusStep = async (payerSlackUserId: string, approverSlackUserId: string, timestamp: string, approve: boolean, teamId: string | undefined, context: SlackAppContext, payload: MessageBlockAction<ButtonAction>, env: HonoSlackAppEnv) => {
  const notifyChannelId = await getNotifyChannelId(teamId, env);
  const channelId = await getOrOpenDMChannelId(payerSlackUserId, context.client, env);

  // TODO: API を叩いてユーザのステータスを更新する

  try {
    await Promise.allSettled([
      // 承認・拒否の結果をスレッドで送信
      context.client.chat.postMessage({
        channel: notifyChannelId,
        thread_ts: timestamp,
        text: generateTextForApprover(approverSlackUserId, approve),
      }),

      // 承認・拒否のリアクションを追加
      context.client.reactions.add({
        channel: notifyChannelId,
        timestamp,
        name: approve ? 'white_check_mark' : 'no_entry_sign',
      }),
      // 既存のリアクションを削除
      context.client.reactions.remove({
        channel: notifyChannelId,
        timestamp,
        name: approve ? 'no_entry_sign' : 'white_check_mark',
      }),

      // 承認・拒否の結果をユーザに送信
      context.client.chat.postMessage({
        channel: channelId,
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

これで継続手続きは完了です`;
  }

  return `:no_entry_sign: *承認申請が拒否されました*
拒否者: <@${approverSlackUserId}>

誤りの場合は役員に確認してください`;
}
