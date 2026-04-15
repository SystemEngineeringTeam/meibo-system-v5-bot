import type { AnyHomeTabBlock, EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { apiClient } from '@/lib/fetche-client';
import { getUserId } from '@/lib/get-user-id';

export const appHomeOpenedEventHandler: EventLazyHandler<'app_home_opened', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const slackUserId = payload.user;

  try {
    const userId = await getUserId(slackUserId, { client: context.client, env });

    const statusRes = await apiClient.GET('/members/{publicId}/status', {
      params: { path: { publicId: userId }, query: { limit: '100' } },
    });

    const isRenewalPending = statusRes.data?.value.currentStatusDetail.renewStatus?.type === 'RENEW_WAITING';

    await context.client.views.publish({
      user_id: payload.user,
      view: {
        type: 'home',
        blocks: buildBlocks(isRenewalPending),
      },
    });
  } catch (error) {
    console.error('Error handling app_home_opened event:', error);
    await context.client.views.publish({
      user_id: payload.user,
      view: {
        type: 'home',
        blocks: [
          {
            type: 'section',
            text: {
              text: 'ユーザ情報の取得に失敗しました。管理者に連絡してください。',
              type: 'mrkdwn',
            },
          },
        ],
      },
    });
  }
};

function buildBlocks(isRenewalPending: boolean): AnyHomeTabBlock[] {
  return [
    {
      type: 'section',
      text: {
        text: '*名簿管理システム*',
        type: 'mrkdwn',
      },
    },
    generateRenewalPendingBlock(isRenewalPending),
  ];
}

function generateRenewalPendingBlock(isRenewalPending: boolean): AnyHomeTabBlock {
  if (!isRenewalPending) {
    return {
      type: 'section',
      text: {
        text: '継続手続きの対象ではありません。',
        type: 'mrkdwn',
      },
    };
  }

  return {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '継続手続きを開始する',
        },
        style: 'primary',
        action_id: 'start_continuation_from_home',
      },
    ],
  };
}
