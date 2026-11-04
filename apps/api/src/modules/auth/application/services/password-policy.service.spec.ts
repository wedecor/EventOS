import {
  MIN_PASSWORD_LENGTH,
  PasswordPolicyService,
  type PasswordPolicyViolation,
} from './password-policy.service';

describe('PasswordPolicyService (R1-10, docs/14 §Password Requirements)', () => {
  let service: PasswordPolicyService;

  beforeEach(() => {
    service = new PasswordPolicyService();
  });

  function reasons(password: string): PasswordPolicyViolation[] {
    const result = service.validate(password);
    if (result.ok) {
      return [];
    }
    return (result.error.details?.reasons ?? []) as PasswordPolicyViolation[];
  }

  it('accepts a password that meets every requirement', () => {
    expect(service.validate('Str0ng!Passw0rd').ok).toBe(true);
  });

  it('accepts a password that is exactly 12 characters (boundary)', () => {
    const password = 'Abcdef1!ghiJ';
    expect(password).toHaveLength(MIN_PASSWORD_LENGTH);
    expect(service.validate(password).ok).toBe(true);
  });

  it('rejects a password that is one character too short', () => {
    const password = 'Abcde1!ghiJ';
    expect(password).toHaveLength(MIN_PASSWORD_LENGTH - 1);
    expect(reasons(password)).toContain('MIN_LENGTH');
  });

  it('rejects a password with no uppercase letter', () => {
    expect(reasons('str0ng!passw0rd')).toContain('UPPERCASE');
  });

  it('rejects a password with no lowercase letter', () => {
    expect(reasons('STR0NG!PASSW0RD')).toContain('LOWERCASE');
  });

  it('rejects a password with no number', () => {
    expect(reasons('Strong!Password')).toContain('NUMBER');
  });

  it('rejects a password with no special character', () => {
    expect(reasons('Str0ngPassw0rdX')).toContain('SPECIAL_CHARACTER');
  });

  it('reports every unmet requirement at once', () => {
    // "aaaaaaaaaaaa" — long enough, but only lowercase letters.
    expect(reasons('aaaaaaaaaaaa').sort()).toEqual(
      ['NUMBER', 'SPECIAL_CHARACTER', 'UPPERCASE'].sort(),
    );
  });

  it('returns a VALIDATION_ERROR on failure', () => {
    const result = service.validate('short');
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error.code).toBe('VALIDATION_ERROR');
    }
  });
});
