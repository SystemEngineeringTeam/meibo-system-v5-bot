import type { EventLazyHandler } from 'slack-cloudflare-workers';
import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { AfterInputMemberInfoQue } from '@/types/que';
import { que } from '@/utils/que';

export const messageHandler: EventLazyHandler<'message', HonoSlackAppEnv>
  = async ({ context, payload, env }) => {
    // Bot自身のメッセージは無視（無限ループ防止）

    // DMだけ処理（IM = Direct Message）
    if (payload.channel_type !== 'im') return;
    // Botのメッセージは無視
    if (payload.subtype === 'bot_message') return;
    // テキストがないメッセージは無視
    if (!('text' in payload)) return;

    await que.send<AfterInputMemberInfoQue>(env.AFTER_INPUT_MEMBER_INFO_QUE, {
      type: 'newcommer',
      slackUserId: 'U123456789',
      validMemberInfo: { detail: { type: 'ACTIVE' } } as ValiedMemberInfo,
    });

    try {
      await context.client.chat.postMessage({
        channel: payload.channel,
        text: `You said: ${payload.text} ${payload.user}`,
      });
    } catch (error) {
      console.error('Error handling message event:', error);
    }
  };
