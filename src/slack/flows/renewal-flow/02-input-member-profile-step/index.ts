import type { DefaultValues } from '@/slack/flows/shared/send-input-member-profile-modal';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { InferResponseType } from '@/types/openapi';
import type { SlackHandlerOptionsWithTriggerId } from '@/types/slack-handler-options';
import type { NormalizedViewState } from '@/utils/normalize-slack-view-state';
import { memberSchema } from '@slack/schemas/member';
import dayjs from 'dayjs';
import { safeParse } from 'valibot';
import { apiClient } from '@/lib/fetche-client';
import { getOrOpenDMChannelId } from '@/lib/get-dm-channel-id';
import { getTriggerId } from '@/lib/get-trigger-id';
import { getUserId } from '@/lib/get-user-id';
import { MeiboApiService } from '@/lib/meibo-api-service';
import { toSlackErrors } from '@/lib/to-slack-error';
import { sendInputMemberProfileModal } from '@/slack/flows/shared/send-input-member-profile-modal';

export const confirmRegistrationStep = async (slackUserId: string, selectMemberTypeTimestamp: string, { client, env, triggerId }: SlackHandlerOptionsWithTriggerId) => {
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

interface CreateMemberDetailResultSuccess {
  success: true;
  data: InferResponseType<'/members/_rpc/submit-info', 'post'>;
}

interface CreateMemberDetailResultFailure {
  success: false;
  errors: Record<string, string>;
}

export const updateMemberDetail = async (slackUserId: string, inputValues: NormalizedViewState, { env }: { env: HonoSlackAppEnv }): Promise<CreateMemberDetailResultSuccess | CreateMemberDetailResultFailure> => {
  const memberDetail = safeParse(memberSchema, inputValues);

  if (!memberDetail.success) {
    return {
      success: false,
      errors: toSlackErrors(memberDetail.issues),
    };
  }

  try {
    const res = await MeiboApiService.putMemberDetail(slackUserId, memberDetail.output, { env });
    if (res.data) return { success: true, data: res.data };

    return {
      success: false,
      errors: {
        warning_divider: '部員情報の登録に失敗しました。時間をおいて再度お試しください。',
      },
    };
  } catch (error) {
    console.error('Failed to create member detail:', error);
    return {
      success: false,
      errors: {
        warning_divider: '部員情報の更新に失敗しました。時間をおいて再度お試しください。',
      },
    };
  }
};
