import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { UserData } from '@/types/kv';
import type { InferRequestBodyType, InferResponseType } from '@/types/openapi';
import { kv } from '@/utils/kv';
import { client } from './fetche-client';
import { getUserId } from './get-user-id';

interface Options {
  env: HonoSlackAppEnv;
}

type Status = InferRequestBodyType<'/members/{publicId}/status', 'post'>['status'];
type CurrentStatus = InferResponseType<'/members/{publicId}/status', 'get'>['value']['currentStatus'];

export const MeiboApiService = {
  async createMember(slackUserId: string, sub: string) {
    // TODO: accessToken 周りを middleware 化する
    const res = await client.POST('/members', {
      body: { slackId: slackUserId, subject: sub },
    });
    if (res.data) return res.data.value.publicId;

    throw new Error('Failed to create member');
  },

  async putMemberDetail(slackUserId: string, memberInfo: ValiedMemberInfo, { env }: Options) {
    const userId = await getUserId(slackUserId, { env });

    return await client.POST('/members/_rpc/submit-info', {
      body: {
        publicId: userId,
        ...memberInfo,
      },
    });
  },

  async updateMemberStatus(slackUserId: string, status: Status, { env }: Options) {
    const userId = await getUserId(slackUserId, { env });

    // TODO: accessToken 周りを middleware 化する
    return await client.POST('/members/{publicId}/status', {
      body: { status },
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

    // TODO: accessToken 周りを middleware 化する
    const status = await client.GET('/members/{publicId}/status', { params: { path: { publicId: userData.userId } } });
    if (!status.data) return 'BEFORE_SUBMIT';

    return status.data.value.currentStatus;
  },
};
