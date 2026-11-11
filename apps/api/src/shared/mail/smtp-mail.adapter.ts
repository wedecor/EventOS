import nodemailer from 'nodemailer';
import type { Transporter } from 'nodemailer';
import type { MailMessage, MailPort, MailSendResult } from './mail.port';

export type SmtpMailConfig = {
  host: string;
  port: number;
  secure?: boolean;
  user?: string;
  pass?: string;
  defaultFromName?: string;
  defaultFromEmail: string;
};

export class SmtpMailAdapter implements MailPort {
  readonly providerName = 'smtp';
  private readonly transporter: Transporter;

  constructor(private readonly config: SmtpMailConfig) {
    this.transporter = nodemailer.createTransport({
      host: config.host,
      port: config.port,
      secure: config.secure ?? false,
      auth:
        config.user && config.pass
          ? { user: config.user, pass: config.pass }
          : undefined,
    });
  }

  async send(message: MailMessage): Promise<MailSendResult> {
    const fromName = message.fromName ?? this.config.defaultFromName;
    const fromEmail = message.fromEmail ?? this.config.defaultFromEmail;
    const from = fromName ? `"${fromName}" <${fromEmail}>` : fromEmail;

    try {
      const info = await this.transporter.sendMail({
        from,
        to: message.to,
        subject: message.subject,
        text: message.text,
        html: message.html,
        attachments: message.attachments?.map((attachment) => ({
          filename: attachment.filename,
          content: attachment.content,
          contentType: attachment.contentType,
        })),
      });
      return {
        accepted: true,
        provider: this.providerName,
        providerMessageId: String(info.messageId ?? ''),
        status: 'accepted',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'SMTP send failed';
      return {
        accepted: false,
        provider: this.providerName,
        status: 'failed',
        errorMessage,
      };
    }
  }
}
