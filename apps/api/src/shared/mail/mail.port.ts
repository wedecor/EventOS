export const MAIL_PORT = Symbol('MAIL_PORT');

export type MailAttachment = {
  filename: string;
  content: Buffer;
  contentType: string;
};

export type MailMessage = {
  to: string;
  subject: string;
  text: string;
  html: string;
  fromName?: string;
  fromEmail?: string;
  attachments?: MailAttachment[];
  idempotencyKey?: string;
};

export type MailSendResult = {
  accepted: boolean;
  provider: string;
  providerMessageId?: string;
  /** Provider accepted the request — not proof of mailbox delivery. */
  status: 'accepted' | 'failed';
  errorMessage?: string;
};

export interface MailPort {
  readonly providerName: string;
  send(message: MailMessage): Promise<MailSendResult>;
}
