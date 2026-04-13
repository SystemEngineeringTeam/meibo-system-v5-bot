import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { MeiboApiService } from '@/lib/meibo-api-service';

export const updateMemberStatusStep = async (payerSlackUserId: string, approverSlackUserId: string, timestamp: string, approve: boolean, teamId: string | undefined, { client, env }: SlackHandlerOptions) => {
  const notifyChannelId = await getNotifyChannelId(teamId, env);
  const channelId = await getOrOpenDMChannelId(payerSlackUserId, { client, env });

  await MeiboApiService.updateMemberStatus(payerSlackUserId, approverSlackUserId, 'ACTIVE', !approve, { env });

  await Promise.all([
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

これで継続手続きは完了です`;
  }

  return `:no_entry_sign: *承認申請が拒否されました*
拒否者: <@${approverSlackUserId}>

誤りの場合は役員に確認してください`;
}
