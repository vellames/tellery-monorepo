import nodemailer, { Transporter } from 'nodemailer';
import { IMailer, SendMailInput } from '../../interfaces';

export interface MailerConfig {
  host: string | undefined;
  port: number;
  secure: boolean;
  user: string | undefined;
  pass: string | undefined;
  from: string;
}

export class NodemailerMailer implements IMailer {
  private readonly transporter: Transporter;

  constructor(private readonly config: MailerConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure,
      auth: config.user ? { user: config.user, pass: config.pass } : undefined,
    });
  }

  async send(input: SendMailInput): Promise<void> {
    await this.transporter.sendMail({
      from: this.config.from,
      to: input.to,
      subject: input.subject,
      html: input.html,
      text: input.text,
    });
  }
}
