import { describe, expect, it } from 'vitest';
import * as Sentry from '@sentry/nextjs';
import {
  addSignupBreadcrumb,
  detectTrafficSource,
  detectWebview,
  setLeadMonitoringContext,
  SignupBreadcrumb,
} from '@/lib/monitoring/sentry';

describe('Sentry monitoring helpers', () => {
  it('detects traffic source from explicit source query param', () => {
    expect(detectTrafficSource('?source=instagram&fbclid=123')).toBe(
      'instagram'
    );
  });

  it('infers traffic source from click ids', () => {
    expect(detectTrafficSource('?ttclid=abc')).toBe('tiktok');
    expect(detectTrafficSource('?fbclid=abc')).toBe('meta');
  });

  it('detects in-app webviews and crawlers', () => {
    expect(detectWebview('Mozilla/5.0 musical_ly_45.7.3')).toBe('tiktok');
    expect(detectWebview('Mozilla/5.0 [FB_IAB/FB4A;FBAV/567]')).toBe(
      'facebook_instagram'
    );
    expect(detectWebview('meta-externalads/1.1')).toBe('bot');
  });

  it('emits a signup funnel metric for breadcrumbs', () => {
    setLeadMonitoringContext({
      localUuid: 'local-1',
      queryParams: '?source=instagram',
      deviceInfo: {
        userAgent: 'Mozilla/5.0 [FB_IAB/FB4A;FBAV/567]',
        connection: { effectiveType: '4g' },
        deviceMemory: 4,
      },
    });

    addSignupBreadcrumb(SignupBreadcrumb.FORM_VISIBLE);

    expect(Sentry.metrics.count).toHaveBeenCalledWith('signup_funnel', 1, {
      attributes: {
        step: 'signup_form_visible',
        traffic_source: 'instagram',
        webview: 'facebook_instagram',
        connection_type: '4g',
        device_memory: 4,
      },
    });
  });

  it('emits a time-on-page distribution when the page is hidden', () => {
    addSignupBreadcrumb(SignupBreadcrumb.PAGE_HIDDEN, { timeOnPageMs: 1234 });

    expect(Sentry.metrics.distribution).toHaveBeenCalledWith(
      'signup_time_on_page',
      1234,
      {
        unit: 'millisecond',
        attributes: expect.objectContaining({
          step: 'signup_page_hidden',
        }),
      }
    );
  });
});
