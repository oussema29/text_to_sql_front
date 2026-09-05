export type UserRole = 'ANALYST' | 'ADMIN';

// No `token` field: the JWT travels only in an httpOnly Set-Cookie header, never in the JSON body —
// see plan_secure_token_storage.md.
export interface LoginResponse {
  username: string;
  role: UserRole;
}

export interface CurrentUser {
  username: string;
  role: UserRole;
}
