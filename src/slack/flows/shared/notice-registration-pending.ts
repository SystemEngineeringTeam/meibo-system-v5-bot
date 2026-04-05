import type { SlackAppContext } from 'slack-cloudflare-workers';
import type { ConfirmRegistrationApprovalStepResult } from './confirm-registration-approval';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { PayeeData } from '@/types/kv';
import { getOrOpenDMChannelId } from '@/slack/lib/get-dm-channel-id';
import { kv } from '@/utils/kv';

export const baseNoticeRegistrationPendingStep = () => async (slackUserId: string, payeeName: string, result: ConfirmRegistrationApprovalStepResult, context: SlackAppContext, env: HonoSlackAppEnv) => {
  // ユーザのDMチャンネルIDを取得
  const channelId = await getOrOpenDMChannelId(slackUserId, context.client, env);

  const payeeData = await kv.get<PayeeData>(env.PAYEE_KV, payeeName);

  try {
    await context.client.chat.postMessage({
      channel: channelId,
      text: generateText(result, payeeName, payeeData?.slackUserId),
      mrkdwn: true,
    });
  } catch (error) {
    console.error('Failed to send confirmation message:', error);
    return false;
  }

  return true;
};

function generateText(result: ConfirmRegistrationApprovalStepResult, payeeName: string, payeeSlackUserId?: string): string {
  if (result.success) {
    return `:hourglass_flowing_sand: *承認申請を送信しました*
しばらく経っても承認されない場合は役員に確認してください

支払い相手: ${payeeName}(${payeeSlackUserId ? `<@${payeeSlackUserId}>` : '不明'})`;
  }

  if (result.reason === 'no_request_data') {
    return `:warning: *申請内容がありません*`;
  }

  return `:hourglass_flowing_sand: *承認申請が送信できませんでした*
再度お試しください`;
}
