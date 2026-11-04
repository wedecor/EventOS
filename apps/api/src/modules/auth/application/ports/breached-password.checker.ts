// R1-10 — application-layer port for breached-password detection (docs/14 §Password
// Requirements: "Breach detection — Check against known breach databases (Have I Been
// Pwned API)"). The application service depends only on this abstraction; the
// infrastructure adapter performs the k-Anonymity HTTP lookup (SHA-1 prefix only,
// plaintext never transmitted). Tests provide a mock. No HTTP logic lives in the
// application layer.
export abstract class BreachedPasswordChecker {
  // Returns true only when the password is confirmed to appear in the breach
  // corpus. Implementations fail-open: if the breach service cannot be reached the
  // password is treated as not-breached (returns false) so a third-party outage
  // never blocks a legitimate password change.
  abstract isBreached(plainTextPassword: string): Promise<boolean>;
}
