export type UserRole = 'ANALYST' | 'ADMIN';

export interface LoginResponse {
  token: string;
  username: string;
  role: UserRole;
}

export interface CurrentUser {
  username: string;
  role: UserRole;
}
