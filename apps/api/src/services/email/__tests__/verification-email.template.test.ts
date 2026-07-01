import { renderVerificationEmail } from '../verification-email.template';

describe('renderVerificationEmail', () => {
  const params = {
    brandName: 'Tellery',
    brandTagline: 'Stories you take part in',
    preheader: 'Confirm your email',
    title: 'Verify your email',
    greeting: 'Welcome, Ana',
    body: 'Click the button to verify.',
    buttonText: 'Verify email',
    url: 'https://example.com/verify-email?token=abc&lang=en',
    footerNote: 'Ignore this if you did not register.',
    footerCopyright: '© 2026 Tellery',
  };

  it('renders an HTML document containing the brand and copy', () => {
    const html = renderVerificationEmail(params);

    expect(html).toContain('<!DOCTYPE html>');
    expect(html).toContain('Tellery');
    expect(html).toContain(params.title);
    expect(html).toContain(params.greeting);
    expect(html).toContain(params.body);
    expect(html).toContain(params.buttonText);
    expect(html).toContain(params.footerCopyright);
  });

  it('embeds the verification url in the call-to-action button', () => {
    const html = renderVerificationEmail(params);

    expect(html).toContain(`href="${params.url.replace(/&/g, '&amp;')}"`);
  });

  it('uses the interface brand colors', () => {
    const html = renderVerificationEmail(params);

    expect(html).toContain('#6e1f2b');
    expect(html).toContain('#c49a4a');
    expect(html).toContain('#f7f1e7');
  });

  it('escapes html-unsafe characters in interpolated copy', () => {
    const html = renderVerificationEmail({
      ...params,
      greeting: 'Welcome <script>bad</script>',
    });

    expect(html).not.toContain('<script>bad</script>');
    expect(html).toContain('&lt;script&gt;');
  });
});
