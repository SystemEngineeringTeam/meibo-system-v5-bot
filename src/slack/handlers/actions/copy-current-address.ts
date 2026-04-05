import type { BlockActionAckHandler, ButtonAction, MessageBlockAction } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';

export const copyCurrentAddressActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async () => {

};
