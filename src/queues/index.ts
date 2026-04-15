import type { HonoSlackAppEnv } from '@/types/hono';
import type { AfterInputMemberInfoQue } from '@/types/que';
import { SlackApp } from 'slack-cloudflare-workers';
import { createNewcomerMember } from './create-newcommer-member';
import { updateRenewalMember } from './update-renewal-member';

export const queue = async (batch: MessageBatch, env: HonoSlackAppEnv) => {
  const slackApp = new SlackApp({ env });

  await Promise.all(batch.messages.map(async (message) => {
    const job = message.body as string;
    const data = JSON.parse(job) as AfterInputMemberInfoQue;
    if (data.type === 'renewal') await updateRenewalMember(data.slackUserId, data.validMemberInfo, { env, client: slackApp.client });
    else if (data.type === 'newcommer') await createNewcomerMember(data.slackUserId, data.validMemberInfo, { env, client: slackApp.client });
  }));
};
