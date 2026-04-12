import type { ValiedMemberInfo } from '@/slack/schemas/member';
import type { UserClaims } from '@/types/auth';
import type { HonoSlackAppEnv } from '@/types/hono';
import type { TmpApiAltData, UserData } from '@/types/kv';
import { v4 } from 'uuid';
import { kv } from '@/utils/kv';
import { client } from './fetche-client';
import { getUserId } from './get-user-id';

interface Options {
  env: HonoSlackAppEnv;
}

export const MeiboApiService = {
  async createMember(slackUserId: string, user: UserClaims, { env }: Options) {
    // TODO: API にユーザ作成リクエストを送る
    // API から帰ってくる userId を想定
    const uuid = v4();

    await kv.put<UserData>(env.USER_KV, slackUserId, { userId: uuid, ...user });
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

  async updateMemberStatus(slackUserId: string, status: 'temporary' | 'approved' | 'rejected', { env }: Options) {
    const userId = await getUserId(slackUserId, { env });

    // TODO: API にユーザのステータスを更新するリクエストを送る
    const memberDetail = await kv.get<TmpApiAltData>(env.TMP_API_ALT_KV, userId);
    if (!memberDetail) throw new Error('Member detail not found');
    await kv.put<TmpApiAltData>(env.TMP_API_ALT_KV, userId, { ...memberDetail, status });
  },

  /**
   * TODO: 作成し直す
   * 'BEFORE_CREATE': ユーザ作成前
   * 'CREATED': ユーザ作成後、詳細情報保存前
   * 'DETAIL_SAVED': 詳細情報保存後
   * 'APPROVED': 承認後
   */
  async getMemberNewcommerStep(slackUserId: string, { env }: Options): Promise<'BEFORE_CREATE' | 'CREATED' | 'DETAIL_SAVED' | 'APPROVED' | ''> {
    const userData = await kv.get<UserData>(env.USER_KV, slackUserId);
    if (!userData) return 'BEFORE_CREATE';

    const memberDetail = await kv.get<TmpApiAltData>(env.TMP_API_ALT_KV, userData.userId);
    if (!memberDetail) return 'CREATED';

    if (memberDetail.status === 'temporary') return 'DETAIL_SAVED';

    return 'APPROVED';
  },
};
