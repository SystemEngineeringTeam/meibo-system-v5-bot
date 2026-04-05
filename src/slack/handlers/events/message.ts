import type { EventLazyHandler, SlackEdgeAppEnv } from 'slack-cloudflare-workers';

export const messageHandler: EventLazyHandler<'message', SlackEdgeAppEnv>
  = async ({ context, payload }) => {
    // Bot自身のメッセージは無視（無限ループ防止）

    // DMだけ処理（IM = Direct Message）
    if (payload.channel_type !== 'im') return;
    // Botのメッセージは無視
    if (payload.subtype === 'bot_message') return;
    // テキストがないメッセージは無視
    if (!('text' in payload)) return;

    try {
      await context.client.chat.postMessage({
        channel: payload.channel,
        text: `You said: ${payload.text} ${payload.user}`,
      });
    } catch (error) {
      console.error('Error handling message event:', error);
    }
  };
