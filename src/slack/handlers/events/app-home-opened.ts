import type { AnyHomeTabBlock, EventLazyHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { apiClient } from '@/lib/fetch-client';
import { getUserId } from '@/lib/get-user-id';
import { isAdminUser } from '@/lib/is-admin-user';

export const appHomeOpenedEventHandler: EventLazyHandler<'app_home_opened', HonoSlackAppEnv> = async ({ context, payload, env }) => {
  const slackUserId = payload.user;

  try {
    const userId = await getUserId(slackUserId, { client: context.client, env });

    const statusRes = await apiClient.GET('/members/{publicId}/status', {
      params: { path: { publicId: userId }, query: { limit: '100' } },
    });

    const isRenewalPending = statusRes.data?.value.currentStatusDetail.renewStatus?.type === 'RENEW_WAITING';
    const isAdmin = await isAdminUser(context.client, slackUserId);

    await context.client.views.publish({
      user_id: payload.user,
      view: {
        type: 'home',
        blocks: buildBlocks(isRenewalPending, isAdmin),
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

function buildBlocks(isRenewalPending: boolean, isAdmin: boolean): AnyHomeTabBlock[] {
  const blocks: AnyHomeTabBlock[] = [
    {
      type: 'section',
      text: {
        text: '*名簿管理システム*',
        type: 'mrkdwn',
      },
    },
    generateRenewalPendingBlock(isRenewalPending),
  ];

  if (isAdmin) {
    blocks.push({ type: 'divider' }, generateRetireFlowBlock());
  }

  return blocks;
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

function generateRetireFlowBlock(): AnyHomeTabBlock {
  return {
    type: 'actions',
    elements: [
      {
        type: 'button',
        text: {
          type: 'plain_text',
          text: '要確認の部員を取得する',
        },
        action_id: 'retrieve_flagged_members_from_home',
      },
    ],
  };
}
