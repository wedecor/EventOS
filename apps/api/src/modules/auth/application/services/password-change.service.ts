import { Injectable } from '@nestjs/common';
import {
  failure,
  success,
  type Result,
} from '../../../../shared/application/result';
import { PasswordHistoryRepository } from '../../domain/repositories/password-history.repository';
import { SessionRepository } from '../../domain/repositories/session.repository';
import { UserRepository } from '../../domain/repositories/user.repository';
import { BreachedPasswordChecker } from '../ports/breached-password.checker';
import { PasswordPolicyService } from './password-policy.service';
import { PasswordService } from './password.service';

export type ChangePasswordInput = {
  currentPassword: string;
  newPassword: string;
};

// docs/14 §Password Requirements: "Prevent reuse of last 5 passwords". The 5 most
// recent passwords are the current one plus the previous four retired hashes, so we
// compare the candidate against the current hash and the last (DEPTH - 1) history rows.
export const PASSWORD_HISTORY_DEPTH = 5;

/**
 * R1-10 — self-service password change with complexity, reuse, and breach enforcement
 * (docs/14 §Password Requirements). All business rules live here in the Application
 * layer; repositories persist and the breach checker is an injected port. Follows the
 * Result pattern — no exceptions for business failures.
 *
 * R3-14 — After a successful password change, revoke all refresh sessions for the user
 * (docs/14 §Session Management force-logout semantics applied to credential rotation).
 */
@Injectable()
export class PasswordChangeService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly passwordHistory: PasswordHistoryRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordService: PasswordService,
    private readonly passwordPolicy: PasswordPolicyService,
    private readonly breachedPasswordChecker: BreachedPasswordChecker,
  ) {}

  async changePassword(
    tenantId: string,
    userId: string,
    input: ChangePasswordInput,
  ): Promise<Result<{ success: true }>> {
    const user = await this.userRepository.findById(tenantId, userId);
    if (!user || !user.passwordHash) {
      // The caller is authenticated, so this is defensive: no password on file
      // means there is nothing to verify against.
      return failure('INVALID_CREDENTIALS', 'Current password is incorrect.');
    }

    const currentMatches = await this.passwordService.compare(
      input.currentPassword,
      user.passwordHash,
    );
    if (!currentMatches) {
      return failure('INVALID_CREDENTIALS', 'Current password is incorrect.');
    }

    const policy = this.passwordPolicy.validate(input.newPassword);
    if (!policy.ok) {
      return policy;
    }

    const reused = await this.isReused(
      tenantId,
      userId,
      user.passwordHash,
      input.newPassword,
    );
    if (reused) {
      return failure(
        'VALIDATION_ERROR',
        'This password matches a recently used password. Choose a different password.',
        { reason: 'PASSWORD_REUSED' },
      );
    }

    if (await this.breachedPasswordChecker.isBreached(input.newPassword)) {
      return failure(
        'VALIDATION_ERROR',
        'This password has appeared in a known data breach. Choose a different password.',
        { reason: 'PASSWORD_BREACHED' },
      );
    }

    const newHash = await this.passwordService.hash(input.newPassword);
    await this.userRepository.updatePassword(tenantId, userId, newHash);
    // Retire the replaced password into history only after the change succeeds.
    await this.passwordHistory.add(tenantId, userId, user.passwordHash);
    // Invalidate every refresh session so stolen refresh tokens cannot outlive
    // the password rotation (access JWTs still expire within the 15m TTL).
    await this.sessionRepository.revokeAllForUser(tenantId, userId);

    return success({ success: true });
  }

  // True if the candidate matches the current password or any of the previous
  // (DEPTH - 1) retired passwords. bcrypt comparison only — plaintext is never stored.
  private async isReused(
    tenantId: string,
    userId: string,
    currentHash: string,
    candidate: string,
  ): Promise<boolean> {
    const previousHashes = await this.passwordHistory.findRecentHashes(
      tenantId,
      userId,
      PASSWORD_HISTORY_DEPTH - 1,
    );

    const hashesToCheck = [currentHash, ...previousHashes];
    for (const hash of hashesToCheck) {
      if (await this.passwordService.compare(candidate, hash)) {
        return true;
      }
    }
    return false;
  }
}
