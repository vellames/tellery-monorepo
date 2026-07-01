export interface SendMailInput {
  to: string;
  subject: string;
  html: string;
  text: string;
}

export interface IMailer {
  send(input: SendMailInput): Promise<void>;
}
