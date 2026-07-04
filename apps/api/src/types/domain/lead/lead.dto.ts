export interface CreateLeadDto {
  localUuid: string;
  queryParams?: string;
  deviceInfo?: Record<string, unknown>;
}

export interface UpdateLeadDto {
  name?: string;
  email?: string;
  isPasswordTouched?: boolean;
  isConfirmPasswordTouched?: boolean;
  isPrivacyAccepted?: boolean;
  isTermsAccepted?: boolean;
}

export interface LeadResponseDto {
  id: string;
  localUuid: string;
  queryParams: string | null;
  deviceInfo: Record<string, unknown> | null;
  name: string | null;
  email: string | null;
  isPasswordTouched: boolean;
  isConfirmPasswordTouched: boolean;
  isPrivacyAccepted: boolean;
  isTermsAccepted: boolean;
  userId: string | null;
  createdAt: string;
  updatedAt: string;
}
