// Auth0 から返ってくるユーザ情報の型定義
export interface UserClaims {
  sub: string;
  name?: string;
  nickname?: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
  email?: string;
  email_verified?: boolean;
  org_id?: string;
  [key: string]: unknown;
}
