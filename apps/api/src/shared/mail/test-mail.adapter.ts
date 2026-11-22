import type { MailMessage, MailPort, MailSendResult } from './mail.port';

export type CapturedMail = MailMessage & {
  capturedAt: Date;
  providerMessageId: string;
};

/**
 * In-memory mail adapter for automated tests and local E2E.
 * Success here is NOT real email delivery.
 */
export class TestMailAdapter implements MailPort {
  readonly providerName = 'test';
  readonly sent: CapturedMail[] = [];
  failNext = false;

  send(message: MailMessage): Promise<MailSendResult> {
    if (this.failNext) {
      this.failNext = false;
      return Promise.resolve({
        accepted: false,
        provider: this.providerName,
        status: 'failed',
        errorMessage: 'TestMailAdapter forced failure',
      });
    }
    const providerMessageId = `test-${this.sent.length + 1}-${Date.now()}`;
    this.sent.push({
      ...message,
      capturedAt: new Date(),
      providerMessageId,
    });
    return Promise.resolve({
      accepted: true,
      provider: this.providerName,
      providerMessageId,
      status: 'accepted',
    });
  }

  clear(): void {
    this.sent.length = 0;
  }
}
