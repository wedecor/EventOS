import { UnauthorizedException, type ExecutionContext } from '@nestjs/common';
import {
  EnquiriesSignatureService,
  signEnquiriesFeedBody,
} from '../../application/services/enquiries-signature.service';
import { EnquiriesSignatureGuard } from './enquiries-signature.guard';

const SECRET = 's'.repeat(40);

function context(request: Record<string, unknown>): ExecutionContext {
  return {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
}

describe('EnquiriesSignatureGuard (M5-01)', () => {
  const guard = new EnquiriesSignatureGuard(
    new EnquiriesSignatureService({
      secrets: [SECRET],
      tenantId: 't',
    }),
  );
  const body = '{"enquiryId":"enq-1"}';

  it('passes a correctly signed raw body', () => {
    const timestamp = String(Math.floor(Date.now() / 1000));

    expect(
      guard.canActivate(
        context({
          headers: {
            'x-eventos-timestamp': timestamp,
            'x-eventos-signature': signEnquiriesFeedBody(
              SECRET,
              timestamp,
              body,
            ),
          },
          rawBody: Buffer.from(body),
        }),
      ),
    ).toBe(true);
  });

  it('answers a generic 401 INVALID_SIGNATURE for any failure', () => {
    const attempt = () =>
      guard.canActivate(
        context({ headers: {}, rawBody: Buffer.from(body), ip: '203.0.113.9' }),
      );

    expect(attempt).toThrow(UnauthorizedException);
    try {
      attempt();
    } catch (error: unknown) {
      const response = (error as UnauthorizedException).getResponse() as {
        code: string;
        message: string;
      };
      expect(response.code).toBe('INVALID_SIGNATURE');
      // The message never reveals which check failed.
      expect(response.message).toBe('Invalid or missing request signature.');
    }
  });

  it('rejects an expired signature', () => {
    const timestamp = String(Math.floor(Date.now() / 1000) - 3600);

    expect(() =>
      guard.canActivate(
        context({
          headers: {
            'x-eventos-timestamp': timestamp,
            'x-eventos-signature': signEnquiriesFeedBody(
              SECRET,
              timestamp,
              body,
            ),
          },
          rawBody: Buffer.from(body),
        }),
      ),
    ).toThrow(UnauthorizedException);
  });
});
