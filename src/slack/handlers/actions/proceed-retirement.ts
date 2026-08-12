import type { AnyMessageBlock, BlockActionAckHandler, ButtonAction, MessageBlockAction, SlackAPIClient } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { retirementSelectedMemberStep } from '@/slack/flows/retirement-flow/02-retirement-selected-member-step';

export const proceedRetirementActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  const teamId = context.teamId;
  const channelId = context.channelId;
  const userId = payload.user.id;

  const selectedMemberIds = Object.values(payload.state.values)
    .flatMap((blockState) => Object.values(blockState))
    .flatMap((elementState) => elementState.selected_options?.map((option) => option.value) ?? []);

  if (selectedMemberIds.length === 0) {
    await context.client.chat.postEphemeral({
      channel: channelId ?? await getNotifyChannelId(context.teamId, env),
      user: userId,
      text: '退部処理を進める部員が選択されていません。',
    });
    return;
  }

  try {
    const succeeded = await retirementSelectedMemberStep(teamId, channelId, userId, selectedMemberIds, { client: context.client, env });
    if (succeeded) await disableProcessedCheckboxes(context.client, payload, selectedMemberIds);
  } catch (error) {
    console.error('Error in proceedRetirementActionHandler:', error);

    await context.client.chat.postEphemeral({
      channel: channelId ?? await getNotifyChannelId(context.teamId, env),
      user: payload.user.id,
      text: '退部処理の実行中にエラーが発生しました。管理者に連絡してください。',
    });
  }
};

/** 退部処理済みの部員を、選択済みメッセージの checkboxes から取り除いて再選択できないようにする */
async function disableProcessedCheckboxes(client: SlackAPIClient, payload: MessageBlockAction<ButtonAction>, processedMemberIds: string[]) {
  const processedMemberIdSet = new Set(processedMemberIds);

  const updatedBlocks: AnyMessageBlock[] = (payload.message.blocks ?? [])
    .map((block): AnyMessageBlock => {
      if (block.type !== 'actions') return block;

      const elements = block.elements
        .map((element) => {
          if (element.type !== 'checkboxes') return element;
          return { ...element, options: element.options.filter((option) => !processedMemberIdSet.has(option.value ?? '')) };
        })
        .filter((element) => element.type !== 'checkboxes' || element.options.length > 0);

      return { ...block, elements };
    })
    .filter((block) => block.type !== 'actions' || block.elements.length > 0);

  await client.chat.update({
    channel: payload.channel.id,
    ts: payload.message.ts,
    text: payload.message.text,
    blocks: updatedBlocks,
  });
}
