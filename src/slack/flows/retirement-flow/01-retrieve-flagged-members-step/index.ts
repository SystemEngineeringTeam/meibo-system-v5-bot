import type { AnyMessageBlock, SlackAPIClient } from 'slack-cloudflare-workers';
import type { InferResponseType } from '@/types/openapi';
import type { SlackHandlerOptions } from '@/types/slack-handler-options';
import { apiClient } from '@/lib/fetch-client';
import { getNotifyChannelId } from '@/lib/get-notify-channel-id';
import { chunk } from '@/utils/chunk';

type FlaggedMembers = InferResponseType<'/members/_rpc/retrieve-flagged-members', 'post'>['value']['items'];
type FlaggedMember = FlaggedMembers[number];

const MAX_CHECKBOX_OPTIONS = 10;
// Slack の checkboxes option text は最大75文字
const MAX_OPTION_TEXT_LENGTH = 75;
// Slack の section text は最大3000文字なので、余裕を持って1メッセージあたりのメンション数を制限する
const MAX_MANUAL_REMOVAL_MENTIONS_PER_MESSAGE = 100;

export const retrieveFlaggedMembersStep = async (teamId: string, channelId: string, userId: string, { client, env }: SlackHandlerOptions) => {
  const usersRes = await client.users.list();

  const notifyChannelId = await getNotifyChannelId(teamId, env);

  if (usersRes.members === undefined) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: 'Slackのユーザ一覧が取得できませんでした。管理者に連絡してください',
    });
    throw new Error('Slackのユーザ一覧が取得できませんでした');
  }

  // 解除済みアカウントや BOT アカウントは対象外 (Slackbot は is_bot が false で返ってくるため id で除外)
  const activeMembers = usersRes.members.filter((member) => !member.deleted && !member.is_bot && member.id !== 'USLACKBOT');
  const slackIds = activeMembers.map((member) => member.id).filter((id): id is string => !!id);

  const flaggedMembersRes = await apiClient.POST('/members/_rpc/retrieve-flagged-members', { body: { slackIds } });

  if (!flaggedMembersRes.data) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: '退部候補の部員の取得に失敗しました。管理者に連絡してください',
    });
    throw new Error('退部候補の部員の取得に失敗しました');
  }

  const flaggedMembers: FlaggedMembers = flaggedMembersRes.data.value.items;

  const slackNameByUserId = new Map(
    activeMembers.map((member) => [member.id, member.profile?.display_name || member.real_name || member.name]).filter((entry): entry is [string, string] => !!entry[0] && !!entry[1]),
  );

  try {
    await postMembersSelectMessages(client, notifyChannelId, userId, flaggedMembers, slackNameByUserId);
    await postMembersManualRemovalMessages(client, notifyChannelId, userId, flaggedMembers);
  } catch (error) {
    console.error(error);
    throw error;
  }
};

async function postMembersSelectMessages(client: SlackAPIClient, channelId: string, userId: string, flaggedMembers: FlaggedMembers, slackNameByUserId: Map<string, string>) {
  const membersByDetailType = Object.groupBy(flaggedMembers, (flaggedMember) => flaggedMember.detail.type);

  const stillActivePendingMembers = membersByDetailType.STILL_ACTIVE_PENDING ?? [];
  const stillActivePendingInSlack = stillActivePendingMembers.filter((member) => member.presentInSlack);

  const notRenewedMembers = membersByDetailType.NOT_RENEWED?.filter((member) => member.presentInSlack) ?? [];

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text: '退部処理を進める部員を選択してください。',
  });

  // STILL_ACTIVE_PENDING (Slack に存在する)
  await postMembersSelectMessage(client, channelId, userId, stillActivePendingInSlack, `*[入部手続き中] STILL_ACTIVE_PENDING*\n入部手続き中の部員です。Slack には存在しています`, slackNameByUserId);
  // NOT_RENEWED
  await postMembersSelectMessage(client, channelId, userId, notRenewedMembers, `*[未継続] NOT_RENEWED*\n今年度の継続手続きをしなかった部員です`, slackNameByUserId);
  // LEFT_SLACK_WITHOUT_LEAVE
  await postMembersSelectMessage(client, channelId, userId, membersByDetailType.LEFT_SLACK_WITHOUT_LEAVE ?? [], `*[勝手退部] LEFT_SLACK_WITHOUT_LEAVE*\n部員登録済だが Slack に参加していない部員です。自分で退出したか，管理者によって退出させられています`, slackNameByUserId);
}

async function postMembersSelectMessage(client: SlackAPIClient, channelId: string, userId: string, members: FlaggedMember[], text: string, slackNameByUserId: Map<string, string>) {
  const filteredMembers = members.filter(hasMember);
  if (filteredMembers.length === 0) return;

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text,
    blocks: generateMembersSelectBlock(filteredMembers, text, slackNameByUserId),
  });
}

function hasMember(flaggedMember: FlaggedMember): flaggedMember is Extract<FlaggedMember, { member: unknown }> {
  return 'member' in flaggedMember;
}

function buildMemberOptionText(slackId: string, displayName: string | undefined, publicId: string): string {
  const prefix = `<@${slackId}>: `;
  const suffix = ` (ID:\`${publicId}\`)`;
  const availableForName = MAX_OPTION_TEXT_LENGTH - prefix.length - suffix.length;
  const name = displayName ?? slackId;
  const truncatedName = availableForName > 0 && name.length > availableForName ? `${name.slice(0, Math.max(availableForName - 1, 0))}…` : name;
  return `${prefix}${truncatedName}${suffix}`;
}

function generateMembersSelectBlock(filteredMembers: Array<Extract<FlaggedMember, { member: unknown }>>, text: string, slackNameByUserId: Map<string, string>): AnyMessageBlock[] {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text,
      },
    },
    {
      type: 'actions',
      elements: chunk(filteredMembers, MAX_CHECKBOX_OPTIONS).map((group) => ({
        type: 'checkboxes',
        options: group.map(({ member }) => {
          const slackId = member.slackId;
          return {
            text: {
              type: 'mrkdwn',
              text: buildMemberOptionText(slackId, slackNameByUserId.get(slackId), member.publicId),
            },
            value: member.publicId,
          };
        }),
      })),
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '※この操作を取り消すのは面倒です',
      },
      accessory: {
        type: 'button',
        text: {
          type: 'plain_text',
          text: ':warning:退部処理を進める:warning:',
        },
        value: 'proceed-retirement',
        action_id: 'proceed_retirement',
      },
    },
  ];
}

async function postMembersManualRemovalMessages(client: SlackAPIClient, channelId: string, userId: string, flaggedMembers: FlaggedMembers) {
  const membersByDetailType = Object.groupBy(flaggedMembers, (flaggedMember) => flaggedMember.detail.type);

  const stillActivePendingMembers = membersByDetailType.STILL_ACTIVE_PENDING ?? [];
  const stillActivePendingNotInSlack = stillActivePendingMembers.filter((member) => !member.presentInSlack);

  await client.chat.postEphemeral({
    channel: channelId,
    user: userId,
    text: '入部手続き中もしくは退部処理済みの Slack に存在する部員です。必要に応じて Slack から退出させてください。',
  });

  // UNREGISTERED
  await postMembersManualRemovalMessage(client, channelId, userId, membersByDetailType.UNREGISTERED ?? [], '[未登録] UNREGISTERED', '部員登録前 または 勝手にSlackに入った 部員です。');
  // STILL_ACTIVE_PENDING (Slack に存在しない)
  await postMembersManualRemovalMessage(client, channelId, userId, stillActivePendingNotInSlack, '[入部手続き中] STILL_ACTIVE_PENDING', '入部手続き中のまま Slack から退出した部員です。');
  // REMAINING_SLACK_AFTER_LEAVE
  await postMembersManualRemovalMessage(client, channelId, userId, membersByDetailType.REMAINING_SLACK_AFTER_LEAVE ?? [], '[Slack 追い出し忘れ] REMAINING_SLACK_AFTER_LEAVE', '名簿システム上は退部扱いですが Slack に残っている部員です。');
}

async function postMembersManualRemovalMessage(client: SlackAPIClient, channelId: string, userId: string, members: FlaggedMember[], title: string, description: string) {
  if (members.length === 0) return;

  for (const group of chunk(members, MAX_MANUAL_REMOVAL_MENTIONS_PER_MESSAGE)) {
    await client.chat.postEphemeral({
      channel: channelId,
      user: userId,
      text: title,
      blocks: generateMembersManualRemovalBlock(group, title, description),
    });
  }
}

function generateMembersManualRemovalBlock(members: FlaggedMember[], title: string, description: string): AnyMessageBlock[] {
  const memberMentions = members.map((member) => `<@${getSlackId(member)}>`).join('\n');

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${title}*\n${description}\n\n${memberMentions}`,
      },
    },
  ];
}

function getSlackId(member: FlaggedMember): string | undefined {
  if ('member' in member) return member.member.slackId;
  if ('unknownSlackId' in member.detail) return member.detail.unknownSlackId;
  return undefined;
}
