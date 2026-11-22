import { HttpException, HttpStatus } from '@nestjs/common';
import { failure, success } from '../application/result';
import { resultToResponse } from './result-to-response.helper';

/**
 * R1-11 — covers the shared Result→HTTP adapter so the docs/15 overall line
 * coverageThreshold stays enforceable. Controllers call this on every response;
 * the failure path (HttpException throw) was previously unexercised by unit tests.
 */
describe('resultToResponse', () => {
  it('wraps a successful Result in the { data } envelope', () => {
    expect(resultToResponse(success({ id: '1' }))).toEqual({
      data: { id: '1' },
    });
  });

  it('accepts an optional successStatus without changing the envelope', () => {
    expect(resultToResponse(success(true), HttpStatus.CREATED)).toEqual({
      data: true,
    });
  });

  it('throws HttpException with the mapped status for a known error code', () => {
    expect(() =>
      resultToResponse(failure('NOT_FOUND', 'Missing.', { id: 'x' })),
    ).toThrow(HttpException);

    try {
      resultToResponse(failure('NOT_FOUND', 'Missing.', { id: 'x' }));
    } catch (error) {
      const httpError = error as HttpException;
      expect(httpError.getStatus()).toBe(HttpStatus.NOT_FOUND);
      expect(httpError.getResponse()).toEqual({
        code: 'NOT_FOUND',
        message: 'Missing.',
        details: { id: 'x' },
      });
    }
  });

  it('maps RATE_LIMITED to 429', () => {
    expect(() =>
      resultToResponse(failure('RATE_LIMITED', 'Slow down.')),
    ).toThrow(HttpException);

    try {
      resultToResponse(failure('RATE_LIMITED', 'Slow down.'));
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
  });

  it('falls back to 500 for an unknown error code', () => {
    expect(() => resultToResponse(failure('UNKNOWN_CODE', 'Boom.'))).toThrow(
      HttpException,
    );

    try {
      resultToResponse(failure('UNKNOWN_CODE', 'Boom.'));
    } catch (error) {
      expect((error as HttpException).getStatus()).toBe(
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  });
});
