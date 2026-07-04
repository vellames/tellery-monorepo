import { describe, expect, it } from 'vitest';
import { detectTrafficSource, detectWebview } from '@/lib/monitoring/sentry';

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
});
