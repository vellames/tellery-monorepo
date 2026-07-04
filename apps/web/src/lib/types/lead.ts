export interface Lead {
  id: string;
  localUuid: string;
  queryParams: string | null;
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

export interface CreateLeadPayload {
  localUuid: string;
  queryParams?: string;
}

export interface UpdateLeadPayload {
  name?: string;
  email?: string;
  isPasswordTouched?: boolean;
  isConfirmPasswordTouched?: boolean;
  isPrivacyAccepted?: boolean;
  isTermsAccepted?: boolean;
}
