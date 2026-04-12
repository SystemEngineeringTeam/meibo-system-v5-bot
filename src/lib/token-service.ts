import type { HonoSlackAppEnv } from '@/types/hono';
import type { AccessTokenData, RefreshTokenData } from '@/types/kv';
import { AuthenticationClient } from 'auth0';
import { kv } from '@/utils/kv';

const auth0Client = new AuthenticationClient({
  domain: process.env.AUTH0_DOMAIN,
  clientId: process.env.AUTH0_CLIENT_ID,
  clientSecret: process.env.AUTH0_CLIENT_SECRET,
});

interface Options {
  env: HonoSlackAppEnv;
}

export const TokenService = {
  async save(slackUserId: string, accessToken: string, accessTokenExpirationMs: number, refreshToken: string | undefined, { env }: Options) {
    // accessToken の有効期限は tokenSet.expiresAt(ミリ秒) - 30 秒 (安全マージン) とする;
    const accessTokenKvExpiration = accessTokenExpirationMs / 1000 - 30;
    // accessToken を保存
    await kv.put<AccessTokenData>(env.ACCESS_TOKEN_KV, slackUserId, { accessToken }, { expiration: accessTokenKvExpiration });

    // refreshToken を保存
    if (refreshToken) {
      const refreshTokenKvExpiration = 31557600 - 30; // 約1年 (Auth0の設定値) - 30秒 (安全マージン)
      await kv.put<RefreshTokenData>(env.REFRESH_TOKEN_KV, slackUserId, { refreshToken }, { expiration: refreshTokenKvExpiration });
    }
  },

  async getAccessToken(slackUserId: string, { env }: Options): Promise<string | null> {
    // 有効な accessToken があればそれを返す
    const accessTokenData = await kv.get<AccessTokenData>(env.ACCESS_TOKEN_KV, slackUserId);
    if (accessTokenData) return accessTokenData.accessToken;

    // 有効な refreshToken があればそれを使って新しい accessToken を取得し、返す
    const refreshedAccessToken = await this.refresh(slackUserId, { env });
    if (refreshedAccessToken) return refreshedAccessToken;

    // 有効なトークンがない場合は null を返す
    return null;
  },

  async refresh(slackUserId: string, { env }: Options): Promise<string | null> {
    const refreshTokenData = await kv.get<RefreshTokenData>(env.REFRESH_TOKEN_KV, slackUserId);
    if (!refreshTokenData) return null;

    try {
      const tokenSet = await auth0Client.oauth.refreshTokenGrant({ refresh_token: refreshTokenData.refreshToken });
      await this.save(slackUserId, tokenSet.data.access_token, tokenSet.data.expires_in, tokenSet.data.refresh_token, { env });
      return tokenSet.data.access_token;
    } catch (error) {
      console.error('Failed to refresh access token:', error);
      return null;
    }
  },

  async delete(slackUserId: string, { env }: Options) {
    await Promise.all([
      env.ACCESS_TOKEN_KV.delete(slackUserId),
      env.REFRESH_TOKEN_KV.delete(slackUserId),
    ]);
  },
};
