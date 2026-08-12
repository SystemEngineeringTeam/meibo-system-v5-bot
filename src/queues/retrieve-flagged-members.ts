import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { retrieveFlaggedMembersStep } from '@/slack/flows/retirement-flow/01-retrieve-flagged-members-step';

export const processRetrieveFlaggedMembers = async (teamId: string, channelId: string, userId: string, { env, client }: SlackHandlerOptions): Promise<boolean> => {
  try {
    await retrieveFlaggedMembersStep(teamId, channelId, userId, { client, env });
    return true;
  } catch (error) {
    console.error('Failed to retrieve flagged members:', error, error instanceof Error ? { name: error.name, message: error.message } : { value: error });
    return false;
  }
};
