import type { AnyMessageBlock, BlockActionAckHandler, ButtonAction, MessageBlockAction, SlackAPIClient } from 'slack-cloudflare-workers';
import type { HonoSlackAppEnv } from '@/types/hono';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { retirementSelectedMemberStep } from '@/slack/flows/retirement-flow/02-retirement-selected-member-step';

export const proceedRetirementActionHandler: BlockActionAckHandler<'button', HonoSlackAppEnv, MessageBlockAction<ButtonAction>> = async ({ context, payload, env }) => {
  const teamId = context.teamId;
  const channelId = context.channelId;
  const userId = payload.user.id;

  // 現在メッセージ上に実際に存在する checkbox の value のみを対象にする
  // (クライアント側の表示が更新前のままだと、既に退部処理済みで消したはずの選択肢が
  //  state.values に残ってしまうことがあるため)
  const currentCheckboxValues = new Set(
    (payload.message.blocks ?? [])
      .filter((block) => block.type === 'actions')
      .flatMap((block) => block.elements)
      .filter((element) => element.type === 'checkboxes')
      .flatMap((element) => element.options)
      .map((option) => option.value),
  );

  const selectedOptions = Object.values(payload.state.values)
    .flatMap((blockState) => Object.values(blockState))
    .flatMap((elementState) => elementState.selected_options ?? [])
    .filter((option) => currentCheckboxValues.has(option.value));
  const selectedMemberIds = selectedOptions.map((option) => option.value);

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
    if (succeeded) {
      await disableProcessedCheckboxes(context.client, payload, selectedMemberIds);
      await notifyProcessedMembers(context.client, payload, selectedOptions.map((option) => option.text.text));
    }
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

/** 退部処理が完了した部員の一覧をスレッドに返信する */
async function notifyProcessedMembers(client: SlackAPIClient, payload: MessageBlockAction<ButtonAction>, processedMemberTexts: string[]) {
  const memberList = processedMemberTexts.map((text) => `• ${text}`).join('\n');

  await client.chat.postMessage({
    channel: payload.channel.id,
    thread_ts: payload.message.thread_ts ?? payload.message.ts,
    text: `以下の部員の退部処理が完了しました。\n${memberList}`,
  });
}
