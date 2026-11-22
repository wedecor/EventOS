export type AccessTokenPayload = {
  sub: string;
  tenantId: string;
  email: string;
  role: string;
};

export type AuthenticatedUser = AccessTokenPayload;
