jest.mock('resend', () => ({
  Resend: jest.fn(),
}));

import { Resend } from 'resend';
import { ResendMailer } from '../resend-mailer';

describe('ResendMailer', () => {
  const emailsSend = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    (Resend as unknown as jest.Mock).mockImplementation(() => ({
      emails: { send: emailsSend },
    }));
  });

  it('creates the client with the provided api token', () => {
    new ResendMailer({ token: 're_test_token', from: 'Tellery <noreply@example.com>' });

    expect(Resend).toHaveBeenCalledWith('re_test_token');
  });

  it('sends mail using the configured from address', async () => {
    emailsSend.mockResolvedValue({ data: { id: 'abc' }, error: null });

    const mailer = new ResendMailer({
      token: 're_test_token',
      from: 'Tellery <noreply@example.com>',
    });

    await mailer.send({
      to: 'ana@teste.local',
      subject: 'Verify your email',
      html: '<p>html</p>',
      text: 'plain',
    });

    expect(emailsSend).toHaveBeenCalledWith({
      from: 'Tellery <noreply@example.com>',
      to: 'ana@teste.local',
      subject: 'Verify your email',
      html: '<p>html</p>',
      text: 'plain',
    });
  });

  it('throws when resend returns an error', async () => {
    emailsSend.mockResolvedValue({
      data: null,
      error: { name: 'validation_error', message: 'Invalid email' },
    });

    const mailer = new ResendMailer({
      token: 're_test_token',
      from: 'Tellery <noreply@example.com>',
    });

    await expect(
      mailer.send({
        to: 'bad',
        subject: 'Verify your email',
        html: '<p>html</p>',
        text: 'plain',
      })
    ).rejects.toThrow('[email] resend failed: validation_error - Invalid email');
  });
});
