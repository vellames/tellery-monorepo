export interface VerificationEmailTemplateParams {
  brandName: string;
  brandTagline: string;
  preheader: string;
  title: string;
  greeting: string;
  body: string;
  buttonText: string;
  url: string;
  footerNote: string;
  footerCopyright: string;
}

const PRIMARY = '#6e1f2b';
const PRIMARY_DARK = '#3a1018';
const PRIMARY_FOREGROUND = '#fff9ef';
const GOLD = '#c49a4a';
const BACKGROUND = '#f7f1e7';
const CARD = '#fff9ef';
const FOREGROUND = '#241c1a';
const MUTED = '#6e625c';
const BORDER = '#e6d8c7';
const HEADING_FONT = "'Cormorant Garamond', Georgia, 'Times New Roman', serif";
const BODY_FONT =
  "'Mulish', system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif";

export function renderVerificationEmail(
  params: VerificationEmailTemplateParams
): string {
  return `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="color-scheme" content="light only" />
    <title>${escapeHtml(params.title)}</title>
  </head>
  <body style="margin:0;padding:0;background-color:${BACKGROUND};font-family:${BODY_FONT};color:${FOREGROUND};-webkit-font-smoothing:antialiased;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${MUTED};">${escapeHtml(params.preheader)}</div>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:${BACKGROUND};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;background-color:${CARD};border:1px solid ${BORDER};border-radius:24px;overflow:hidden;box-shadow:0 10px 28px rgba(74,17,27,0.10);">
            <tr>
              <td style="background:linear-gradient(135deg,${PRIMARY} 0%,${PRIMARY_DARK} 100%);padding:36px 40px 32px 40px;text-align:center;">
                <h1 style="margin:0;font-family:${HEADING_FONT};font-size:26px;font-weight:700;color:${GOLD};letter-spacing:0.5px;">${escapeHtml(params.brandName)}</h1>
                <p style="margin:6px 0 0 0;font-size:12px;color:${PRIMARY_FOREGROUND};opacity:0.85;letter-spacing:1.5px;text-transform:uppercase;">${escapeHtml(params.brandTagline)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:40px 40px 12px 40px;">
                <h2 style="margin:0 0 8px 0;font-family:${HEADING_FONT};font-size:28px;font-weight:700;color:${PRIMARY};line-height:1.2;">${escapeHtml(params.title)}</h2>
                <p style="margin:0;font-size:16px;line-height:1.5;color:${FOREGROUND};">${escapeHtml(params.greeting)}</p>
              </td>
            </tr>
            <tr>
              <td style="padding:12px 40px 32px 40px;">
                <p style="margin:0 0 28px 0;font-size:15px;line-height:1.6;color:${MUTED};">${escapeHtml(params.body)}</p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td align="center">
                      <a href="${escapeHtml(params.url)}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 36px;font-family:${BODY_FONT};font-size:15px;font-weight:700;color:${PRIMARY_FOREGROUND};background:linear-gradient(135deg,${PRIMARY} 0%,${PRIMARY_DARK} 100%);border-radius:18px;text-decoration:none;box-shadow:0 8px 18px rgba(110,31,43,0.22);">${escapeHtml(params.buttonText)}</a>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
            <tr>
              <td style="padding:0 40px 36px 40px;">
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid ${BORDER};">
                  <tr>
                    <td style="padding:20px 0 0 0;">
                      <p style="margin:0;font-size:13px;line-height:1.6;color:${MUTED};">${escapeHtml(params.footerNote)}</p>
                      <p style="margin:8px 0 0 0;font-size:12px;line-height:1.5;color:${MUTED};word-break:break-all;">${escapeHtml(params.url)}</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
          <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width:560px;width:100%;">
            <tr>
              <td style="padding:20px 8px 0 8px;text-align:center;">
                <p style="margin:0;font-size:12px;color:${MUTED};opacity:0.85;">${escapeHtml(params.footerCopyright)}</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
