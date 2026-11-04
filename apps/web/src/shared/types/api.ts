/** Success envelope used by the frozen Phase 1 API (`docs/09`). */
export type ApiSuccess<T> = {
  data: T;
};

/** Error envelope used by the frozen Phase 1 API (`docs/09`). */
export type ApiErrorBody = {
  code: string;
  message: string;
  details?: unknown;
};

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;
  readonly details?: unknown;

  constructor(status: number, body: ApiErrorBody) {
    super(body.message);
    this.name = 'ApiError';
    this.code = body.code;
    this.status = status;
    this.details = body.details;
  }
}
