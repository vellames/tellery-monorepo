export type AccountType = 'permanent' | 'temporary';

export interface User {
  id: string;
  name: string;
  email: string | null;
  accountType: AccountType;
  ssn: string | null;
  emailVerifiedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export function isTemporaryUser(user: User | null | undefined): boolean {
  return !!user && user.accountType === 'temporary';
}

export interface AuthPayload {
  user: User;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface RegisterPayload {
  name: string;
  email: string;
  password: string;
  leadId?: string;
}

export interface UpdateProfilePayload {
  name: string;
  email: string;
  ssn: string | null;
}

export interface ChangePasswordPayload {
  currentPassword: string;
  newPassword: string;
}

export interface ConvertAccountPayload {
  name: string;
  email: string;
  password: string;
}
