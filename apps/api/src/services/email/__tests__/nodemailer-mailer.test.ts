jest.mock('nodemailer', () => ({
  createTransport: jest.fn(),
}));

import nodemailer from 'nodemailer';
import { NodemailerMailer } from '../nodemailer-mailer';

describe('NodemailerMailer', () => {
  it('creates the transport with the provided smtp config', () => {
    const createTransport = nodemailer.createTransport as jest.Mock;
    createTransport.mockReturnValue({ sendMail: jest.fn() });

    new NodemailerMailer({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'u',
      pass: 'p',
      from: 'Tellery <noreply@example.com>',
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      auth: { user: 'u', pass: 'p' },
    });
  });

  it('omits auth when no user is provided', () => {
    const createTransport = nodemailer.createTransport as jest.Mock;
    createTransport.mockReturnValue({ sendMail: jest.fn() });

    new NodemailerMailer({
      host: 'smtp.example.com',
      port: 25,
      secure: false,
      user: undefined,
      pass: undefined,
      from: 'noreply@example.com',
    });

    expect(createTransport).toHaveBeenCalledWith({
      host: 'smtp.example.com',
      port: 25,
      secure: false,
      auth: undefined,
    });
  });

  it('sends mail using the configured from address', async () => {
    const sendMail = jest.fn().mockResolvedValue({});
    (nodemailer.createTransport as jest.Mock).mockReturnValue({ sendMail });

    const mailer = new NodemailerMailer({
      host: 'smtp.example.com',
      port: 465,
      secure: true,
      user: 'u',
      pass: 'p',
      from: 'Tellery <noreply@example.com>',
    });

    await mailer.send({
      to: 'ana@teste.local',
      subject: 'Verify your email',
      html: '<p>html</p>',
      text: 'plain',
    });

    expect(sendMail).toHaveBeenCalledWith({
      from: 'Tellery <noreply@example.com>',
      to: 'ana@teste.local',
      subject: 'Verify your email',
      html: '<p>html</p>',
      text: 'plain',
    });
  });
});
