import type { UserRecord } from '../../domain/repositories/user.repository';

export type AuthUserDto = {
  id: string;
  email: string;
  name: string;
  role: string;
};

// Result of a login/refresh. `refreshToken` and `refreshTokenExpiresAt` are used
// by the controller to set the HTTP-only cookie (ADR-008) and are NOT returned in
// the JSON body. `expiresIn` is the access-token lifetime in seconds.
export type AuthTokensDto = {
  accessToken: string;
  expiresIn: number;
  refreshToken: string;
  refreshTokenExpiresAt: Date;
  user: AuthUserDto;
};

export function toAuthUserDto(user: UserRecord): AuthUserDto {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
  };
}
