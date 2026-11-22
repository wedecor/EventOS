import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';

// docs/14 §Password Requirements: minimum 12 characters, and at least one uppercase,
// lowercase, number, and special character.
export const MIN_PASSWORD_LENGTH = 12;

export type PasswordPolicyViolation =
  'MIN_LENGTH' | 'UPPERCASE' | 'LOWERCASE' | 'NUMBER' | 'SPECIAL_CHARACTER';

// A special character is anything that is not a letter or a digit.
const UPPERCASE = /[A-Z]/;
const LOWERCASE = /[a-z]/;
const NUMBER = /[0-9]/;
const SPECIAL_CHARACTER = /[^A-Za-z0-9]/;

/**
 * R1-10 — password complexity policy (docs/14 §Password Requirements). Pure business
 * rule: it inspects the candidate password and reports every unmet requirement. It
 * performs no I/O and holds no persistence concerns.
 */
@Injectable()
export class PasswordPolicyService {
  validate(password: string): Result<void> {
    const violations = this.violations(password);
    if (violations.length > 0) {
      return failure(
        'VALIDATION_ERROR',
        'Password does not meet the complexity requirements.',
        { reasons: violations },
      );
    }
    return success(undefined);
  }

  private violations(password: string): PasswordPolicyViolation[] {
    const violations: PasswordPolicyViolation[] = [];
    if (password.length < MIN_PASSWORD_LENGTH) {
      violations.push('MIN_LENGTH');
    }
    if (!UPPERCASE.test(password)) {
      violations.push('UPPERCASE');
    }
    if (!LOWERCASE.test(password)) {
      violations.push('LOWERCASE');
    }
    if (!NUMBER.test(password)) {
      violations.push('NUMBER');
    }
    if (!SPECIAL_CHARACTER.test(password)) {
      violations.push('SPECIAL_CHARACTER');
    }
    return violations;
  }
}
