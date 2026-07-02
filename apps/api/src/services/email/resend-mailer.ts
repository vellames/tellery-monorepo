import { Resend } from 'resend';
import { IMailer, SendMailInput } from '../../interfaces';

export interface MailerConfig {
  token: string | undefined;
  from: string;
}

export class ResendMailer implements IMailer {
  private readonly client: Resend;

  constructor(private readonly config: MailerConfig) {
    this.client = new Resend(config.token);
  }

  async send(input: SendMailInput): Promise<void> {
    const { data, error } = await this.client.emails.send({
      from: this.config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });

    if (error) {
      throw new Error(
        `[email] resend failed: ${error.name} - ${error.message}`
      );
    }

    void data;
  }
}
