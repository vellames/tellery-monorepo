'use client';

import * as Sentry from '@sentry/nextjs';

export const SignupBreadcrumb = {
  PAGE_LOADED: 'signup_page_loaded',
  FORM_VISIBLE: 'signup_form_visible',
  FIRST_FIELD_FOCUS: 'signup_first_field_focus',
  PASSWORD_FOCUS: 'signup_password_focus',
  CONFIRM_PASSWORD_FOCUS: 'signup_confirm_password_focus',
  TERMS_CHECKED: 'signup_terms_checked',
  PRIVACY_CHECKED: 'signup_privacy_checked',
  SUBMIT_CLICKED: 'signup_submit_clicked',
  REGISTER_SUCCESS: 'signup_register_success',
  REGISTER_ERROR: 'signup_register_error',
  PAGE_HIDDEN: 'signup_page_hidden',
  LEAD_CREATE_STARTED: 'signup_lead_create_started',
  LEAD_CREATED: 'signup_lead_created',
  LEAD_CREATE_ERROR: 'signup_lead_create_error',
} as const;

const SIGNUP_BREADCRUMB_CATEGORY = 'signup';
const UNKNOWN_VALUE = 'unknown';
const BOT_WEBVIEW = 'bot';
const TIKTOK_WEBVIEW = 'tiktok';
const META_WEBVIEW = 'facebook_instagram';
const REGULAR_BROWSER = 'browser';

type SignupBreadcrumbName =
  (typeof SignupBreadcrumb)[keyof typeof SignupBreadcrumb];

interface LeadMonitoringContext {
  localUuid: string;
  leadId?: string;
  queryParams?: string;
  deviceInfo?: Record<string, unknown>;
}

export function setLeadMonitoringContext({
  localUuid,
  leadId,
  queryParams,
  deviceInfo,
}: LeadMonitoringContext): void {
  Sentry.setUser({ id: localUuid });
  Sentry.setTag('lead_id', leadId ?? 'pending');
  Sentry.setTag('traffic_source', detectTrafficSource(queryParams));
  Sentry.setTag('webview', detectWebview(deviceInfo?.userAgent));

  const viewport = formatViewport(deviceInfo);
  if (viewport) Sentry.setTag('viewport', viewport);

  const deviceMemory = deviceInfo?.deviceMemory;
  if (deviceMemory !== undefined) {
    Sentry.setTag('device_memory', String(deviceMemory));
  }

  const connection = getConnection(deviceInfo);
  if (connection?.effectiveType) {
    Sentry.setTag('connection_type', String(connection.effectiveType));
  }

  Sentry.setContext('lead', {
    id: leadId,
    localUuid,
    trafficSource: detectTrafficSource(queryParams),
    queryParamsLength: queryParams?.length ?? 0,
  });
  Sentry.setContext('device', sanitizeDeviceContext(deviceInfo));
}

export function addSignupBreadcrumb(
  name: SignupBreadcrumbName,
  data?: Record<string, unknown>
): void {
  Sentry.addBreadcrumb({
    category: SIGNUP_BREADCRUMB_CATEGORY,
    message: name,
    level: 'info',
    data,
  });
}

export function captureSignupException(
  error: unknown,
  name: SignupBreadcrumbName,
  data?: Record<string, unknown>
): void {
  addSignupBreadcrumb(name, data);
  Sentry.captureException(error, {
    tags: { signup_event: name },
    contexts: {
      signup: data,
    },
  });
}

export function detectTrafficSource(queryParams?: string): string {
  if (!queryParams) return UNKNOWN_VALUE;

  const params = new URLSearchParams(queryParams.replace(/^\?/, ''));
  return (
    params.get('source') ??
    params.get('utm_source') ??
    (params.has('ttclid') ? TIKTOK_WEBVIEW : null) ??
    (params.has('fbclid') ? 'meta' : null) ??
    UNKNOWN_VALUE
  );
}

export function detectWebview(userAgent: unknown): string {
  if (typeof userAgent !== 'string') return UNKNOWN_VALUE;

  if (/meta-externalads|GoogleOther/i.test(userAgent)) return BOT_WEBVIEW;
  if (/musical_ly|bytedance|tiktok/i.test(userAgent)) return TIKTOK_WEBVIEW;
  if (/FB_IAB|FBAN|FBAV|Instagram/i.test(userAgent)) return META_WEBVIEW;

  return REGULAR_BROWSER;
}

function formatViewport(deviceInfo?: Record<string, unknown>): string | null {
  const width = deviceInfo?.viewportWidth;
  const height = deviceInfo?.viewportHeight;
  if (width === undefined || height === undefined) return null;

  return `${String(width)}x${String(height)}`;
}

function getConnection(
  deviceInfo?: Record<string, unknown>
): Record<string, unknown> | null {
  const connection = deviceInfo?.connection;
  if (!connection || typeof connection !== 'object') return null;

  return connection as Record<string, unknown>;
}

function sanitizeDeviceContext(
  deviceInfo?: Record<string, unknown>
): Record<string, unknown> | null {
  if (!deviceInfo) return null;

  return {
    userAgent: deviceInfo.userAgent,
    language: deviceInfo.language,
    languages: deviceInfo.languages,
    platform: deviceInfo.platform,
    timezone: deviceInfo.timezone,
    viewportWidth: deviceInfo.viewportWidth,
    viewportHeight: deviceInfo.viewportHeight,
    screenWidth: deviceInfo.screenWidth,
    screenHeight: deviceInfo.screenHeight,
    devicePixelRatio: deviceInfo.devicePixelRatio,
    deviceMemory: deviceInfo.deviceMemory,
    hardwareConcurrency: deviceInfo.hardwareConcurrency,
    touchSupport: deviceInfo.touchSupport,
    maxTouchPoints: deviceInfo.maxTouchPoints,
    connection: deviceInfo.connection,
  };
}
