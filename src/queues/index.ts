import type { HonoSlackAppEnv } from '@/types/hono';
import type { AfterInputMemberInfoQue, RetrieveFlaggedMembersQue } from '@/types/que';
import { SlackApp } from 'slack-cloudflare-workers';
import { createNewcomerMember } from './create-newcommer-member';
import { processRetrieveFlaggedMembers } from './retrieve-flagged-members';
import { updateRenewalMember } from './update-renewal-member';

export const queue = async (batch: MessageBatch, env: HonoSlackAppEnv) => {
  const slackApp = new SlackApp({ env });

  if (batch.queue.endsWith('retrieve-flagged-members')) {
    await Promise.all(batch.messages.map(async (message) => {
      const data = JSON.parse(message.body as string) as RetrieveFlaggedMembersQue;
      await processRetrieveFlaggedMembers(data.teamId, data.channelId, data.userId, { env, client: slackApp.client });
    }));
    return;
  }

  await Promise.all(batch.messages.map(async (message) => {
    const job = message.body as string;
    const data = JSON.parse(job) as AfterInputMemberInfoQue;
    if (data.type === 'newcommer') await createNewcomerMember(data.slackUserId, data.validMemberInfo, data.selectMemberTypeTimestamp, { env, client: slackApp.client });
    else if (data.type === 'renewal') await updateRenewalMember(data.slackUserId, data.validMemberInfo, data.selectMemberTypeTimestamp, { env, client: slackApp.client });
  }));
};
