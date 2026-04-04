import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { ConfirmRegistrationApprovalStepResult } from '../05-1-confirm-registration-approval-step';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { ChannelData } from '@/types/kv';
import { kv } from '@/utils/kv';

export const noticeRegistrationPendingStep = async (slackUserId: string, result: ConfirmRegistrationApprovalStepResult, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelData = await kv.get<ChannelData>(env.CHANNEL_KV, slackUserId);
  if (!channelData) {
    console.error(`No channel data found for user ${slackUserId}`);
    return;
  }

  try {
    await context.client.chat.postMessage({
      channel: channelData.channelId,
      text: generateText(result),
      mrkdwn: true,
    });
  } catch (error) {
    console.error('Failed to send confirmation message:', error);
    return false;
  }

  return true;
};

function generateText(result: ConfirmRegistrationApprovalStepResult): string {
  if (result.success) {
    return `:hourglass_flowing_sand: *承認申請を送信しました*
しばらく経っても承認されない場合は役員に確認してください`;
  }

  if (result.reason === 'sent') {
    return `:white_check_mark: *承認申請は送信済みです*`;
  }

  if (result.reason === 'no_request_data') {
    return `:warning: *申請内容がありません*`;
  }

  return `:hourglass_flowing_sand: *承認申請が送信できませんでした*
再度お試しください`;
}
