export type Result<T> =
  { ok: true; value: T } | { ok: false; error: ApplicationError };

export type ApplicationError = {
  code: string;
  message: string;
  details?: Record<string, unknown>;
};

export function success<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function failure<T>(
  code: string,
  message: string,
  details?: Record<string, unknown>,
): Result<T> {
  return { ok: false, error: { code, message, details } };
}
