import { SmtpMailAdapter } from './smtp-mail.adapter';
import { TestMailAdapter } from './test-mail.adapter';
import type { MailPort } from './mail.port';

export type MailEnv = {
  MAIL_PROVIDER?: string;
  MAIL_FROM_NAME?: string;
  MAIL_FROM_EMAIL?: string;
  SMTP_HOST?: string;
  SMTP_PORT?: string | number;
  SMTP_USER?: string;
  SMTP_PASS?: string;
  SMTP_SECURE?: string | boolean;
};

/** Shared test adapter instance for assertions in unit/e2e when provider=test. */
export const sharedTestMailAdapter = new TestMailAdapter();

export function createMailPort(env: MailEnv = process.env): MailPort {
  const provider = (env.MAIL_PROVIDER ?? 'test').toLowerCase();

  if (provider === 'smtp') {
    const host = env.SMTP_HOST;
    const fromEmail = env.MAIL_FROM_EMAIL;
    if (!host || !fromEmail) {
      throw new Error(
        'MAIL_PROVIDER=smtp requires SMTP_HOST and MAIL_FROM_EMAIL',
      );
    }
    const secure =
      env.SMTP_SECURE === true ||
      env.SMTP_SECURE === 'true' ||
      Number(env.SMTP_PORT) === 465;
    return new SmtpMailAdapter({
      host,
      port: Number(env.SMTP_PORT ?? 587),
      secure,
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
      defaultFromName: env.MAIL_FROM_NAME,
      defaultFromEmail: fromEmail,
    });
  }

  if (provider === 'none') {
    return {
      providerName: 'none',
      send() {
        return Promise.resolve({
          accepted: false,
          provider: 'none',
          status: 'failed' as const,
          errorMessage: 'Mail provider is disabled (MAIL_PROVIDER=none).',
        });
      },
    };
  }

  return sharedTestMailAdapter;
}
