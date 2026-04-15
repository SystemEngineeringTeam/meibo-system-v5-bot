import type { DefaultValues } from '@/slack/flows/shared/send-input-member-profile-modal';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { AfterInputMemberInfoQue } from '@/types/que';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { SlackViewStateInput } from '@/utils/normalize-slack-view-state';
import { memberSchema } from '@slack/schemas/member';
import dayjs from 'dayjs';
import { safeParse } from 'valibot';
import { apiClient } from '@/lib/fetche-client';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getTriggerId } from '@/lib/get-trigger-id';
import { getUserId } from '@/lib/get-user-id';
import { toSlackErrors } from '@/lib/to-slack-error';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';
import { normalizeViewState } from '@/utils/normalize-slack-view-state';
import { que } from '@/utils/que';

export const confirmRegistrationStep = async (slackUserId: string, selectMemberTypeTimestamp: string | undefined, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
  const channelId = await getOrOpenDMChannelId(slackUserId, { client, env });
  const userId = await getUserId(slackUserId, { client, env });
  const validatedTriggerId = await getTriggerId(triggerId, channelId, client);

  const memberInfoRes = await apiClient.GET('/members/{publicId}/info', {
    params: { path: { publicId: userId } },
  });
  if (!memberInfoRes.data) {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 部員情報の取得に失敗しました。管理者に連絡してください。',
    });
    return;
  }
  if (memberInfoRes.data.value.detail.type !== 'ACTIVE') {
    await client.chat.postMessage({
      channel: channelId,
      text: ':warning: 継続手続きは現役部員のみが操作可能です。誤りだと思われる場合は役員に連絡してください。',
    });
    return;
  }

  const defaultValues: DefaultValues = {
    lastName: memberInfoRes.data.value.profile.base.lastName,
    firstName: memberInfoRes.data.value.profile.base.firstName,
    lastNameKana: memberInfoRes.data.value.profile.base.lastNameKana,
    firstNameKana: memberInfoRes.data.value.profile.base.firstNameKana,

    birthday: dayjs(memberInfoRes.data.value.profile.sensitive.birthday).format('YYYY-MM-DD'),
    sex: memberInfoRes.data.value.profile.sensitive.sex,

    phoneNumber: memberInfoRes.data.value.profile.sensitive.phoneNumber,

    currentZipCode: memberInfoRes.data.value.profile.sensitive.currentZipCode,
    currentAddress: memberInfoRes.data.value.profile.sensitive.currentAddress,

    parentsZipCode: memberInfoRes.data.value.profile.sensitive.parentsZipCode,
    parentsAddress: memberInfoRes.data.value.profile.sensitive.parentsAddress,

    // 学年は継続時に多くの人が変更すべき項目のため，初期値にいれない
    // grade: memberInfoRes.data.value.detail.detail.grade,

    ...(memberInfoRes.data.value.detail.active.type === 'INTERNAL'
      ? {
          studentId: memberInfoRes.data.value.detail.active.detail.studentId,
        }
      : {
          schoolName: memberInfoRes.data.value.detail.active.detail.schoolName,
          schoolMajor: memberInfoRes.data.value.detail.active.detail.schoolMajor,
          organization: memberInfoRes.data.value.detail.active.detail.organization ?? undefined,
        }),
  };
  const memberType = memberInfoRes.data.value.detail.active.type;
  await sendInputMemberProfileModal(memberType, 'input_continuing_member_profile', validatedTriggerId, selectMemberTypeTimestamp, client, defaultValues);
};

export const updateMemberDetail = async (slackUserId: string, values: SlackViewStateInput, selectMemberTypeTimestamp: string | undefined, { env }: { env: HonoSlackAppEnv }): Promise<Record<string, string> | null> => {
  const normalizedValues = normalizeViewState(values);
  const memberDetail = safeParse(memberSchema, normalizedValues);

  if (!memberDetail.success) return toSlackErrors(memberDetail.issues);

  await que.send<AfterInputMemberInfoQue>(env.AFTER_INPUT_MEMBER_INFO_QUE, {
    type: 'renewal',
    slackUserId,
    validMemberInfo: memberDetail.output,
    selectMemberTypeTimestamp,
  });

  return null;
};
