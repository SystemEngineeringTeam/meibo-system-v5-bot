import type { SlashCommandAckHandler } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { sendSelectMemberTypeMessage } from '@/slack/flows/new-commer-flow/02-select-member-type-step';

export const selectMemberTypeStepTestCommandHandler: SlashCommandAckHandler<HonoSlackAppEnv> = async ({ context }) => {
  await sendSelectMemberTypeMessage(context.client, context.channelId);
};
