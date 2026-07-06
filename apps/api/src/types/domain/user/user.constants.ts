export const REDACTED_USER_NAME = 'Redacted User';
export const DELETED_USER_PASSWORD_REDACTED = 'DELETED_USER_PASSWORD_REDACTED';
export const REDACTED_EMAIL_PREFIX = 'redacted_';

export const buildRedactedEmail = (userId: string): string =>
  `${REDACTED_EMAIL_PREFIX}${userId}`;
