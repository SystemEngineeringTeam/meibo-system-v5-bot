import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { UserData } from '@/types/kv';
import type { InferRequestBodyType, InferResponseType } from '@/types/openapi';
import { kv } from '@/utils/kv';
import { apiClient } from './fetche-client';
import { getUserId } from './get-user-id';

interface Options {
  env: HonoSlackAppEnv;
}

type Status = InferRequestBodyType<'/members/{publicId}/status', 'post'>['status'];
type CurrentStatus = InferResponseType<'/members/{publicId}/status', 'get'>['value']['currentStatus'];

export const MeiboApiService = {
  async createMember(slackUserId: string, sub: string, { env }: Options) {
    const res = await apiClient.POST('/members', {
      body: { slackId: slackUserId, subject: sub },
    });
    if (res.data) {
      const userId = res.data.value.publicId;
      await kv.put(env.USER_KV, slackUserId, { userId });
      return userId;
    }

    console.error('Failed to create member', { slackUserId, sub, response: res });
    throw new Error('Failed to create member');
  },

  async putMemberDetail(slackUserId: string, memberInfo: ValiedMemberInfo, { env }: Options) {
    const userId = await getUserId(slackUserId, { env });
    return await apiClient.POST('/members/_rpc/submit-info', {
      body: {
        publicId: userId,
        ...memberInfo,
      },
    });
  },

  async updateMemberStatus(payerSlackUserId: string, approverSlackUserId: string, status: Status, reject: boolean, { env }: Options) {
    const userId = await getUserId(payerSlackUserId, { env });

    return await apiClient.POST('/members/{publicId}/status', {
      body: { status, reject, __updaterSlackId: approverSlackUserId },
      params: { path: { publicId: userId } },
    });
  },

  async getMemberInfo(slackUserId: string, { env }: Options) {
    const userId = await getUserId(slackUserId, { env });
    return await apiClient.GET('/members/{publicId}/info', {
      params: { path: { publicId: userId } },
    });
  },

  /**
   * 'NOT_FOUND': 名簿BOT上にもユーザが存在しない状態
   * 'BEFORE_SUBMIT': 名簿API にユーザが存在しない状態
   */
  async getMemberNewcommerStep(slackUserId: string, { env }: Options): Promise<'NOT_FOUND' | 'BEFORE_SUBMIT' | CurrentStatus> {
    const userData = await kv.get<UserData>(env.USER_KV, slackUserId);
    if (!userData) return 'NOT_FOUND';

    try {
      const status = await apiClient.GET('/members/{publicId}/status', { params: { path: { publicId: userData.userId } } });
      if (!status.data) return 'BEFORE_SUBMIT';

      return status.data.value.currentStatus;
    } catch (error) {
      console.error('Error fetching member status:', error);
      return 'NOT_FOUND';
    }
  },
};
