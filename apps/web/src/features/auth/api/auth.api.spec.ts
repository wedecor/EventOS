import { beforeEach, describe, expect, it, vi } from 'vitest';

const post = vi.fn();

vi.mock('@/shared/api/client', () => ({
  apiClient: {
    post: (...args: unknown[]) => post(...args),
  },
}));

describe('authApi', () => {
  beforeEach(() => {
    post.mockReset();
  });

  it('login success parses Zod envelope', async () => {
    const { authApi } = await import('@/features/auth/api/auth.api');
    post.mockResolvedValue({
      data: {
        data: {
          accessToken: 'access',
          expiresIn: 900,
          user: { id: '1', email: 'a@b.co', name: 'A', role: 'owner' },
        },
      },
    });

    const session = await authApi.login({ email: 'a@b.co', password: 'secret' });
    expect(session.accessToken).toBe('access');
    expect(post).toHaveBeenCalledWith('/api/v1/auth/login', {
      email: 'a@b.co',
      password: 'secret',
    });
  });

  it('login failure when response shape is invalid', async () => {
    const { authApi } = await import('@/features/auth/api/auth.api');
    post.mockResolvedValue({ data: { data: { bad: true } } });
    await expect(authApi.login({ email: 'a@b.co', password: 'x' })).rejects.toThrow();
  });

  it('refresh success and failure', async () => {
    const { authApi } = await import('@/features/auth/api/auth.api');
    post.mockResolvedValueOnce({
      data: {
        data: {
          accessToken: 'refreshed',
          expiresIn: 900,
          user: { id: '1', email: 'a@b.co', name: 'A', role: 'owner' },
        },
      },
    });
    await expect(authApi.refresh()).resolves.toMatchObject({ accessToken: 'refreshed' });

    post.mockResolvedValueOnce({ data: {} });
    await expect(authApi.refresh()).rejects.toThrow();
  });

  it('logout posts to OpenAPI path', async () => {
    const { authApi } = await import('@/features/auth/api/auth.api');
    post.mockResolvedValue({ data: { data: { success: true } } });
    await authApi.logout();
    expect(post).toHaveBeenCalledWith('/api/v1/auth/logout', {});
  });

  it('changePassword posts current and new password', async () => {
    const { authApi } = await import('@/features/auth/api/auth.api');
    post.mockResolvedValue({ data: { data: { success: true } } });
    await authApi.changePassword({
      currentPassword: 'old',
      newPassword: 'new-strong-pass',
    });
    expect(post).toHaveBeenCalledWith('/api/v1/auth/change-password', {
      currentPassword: 'old',
      newPassword: 'new-strong-pass',
    });
  });
});
