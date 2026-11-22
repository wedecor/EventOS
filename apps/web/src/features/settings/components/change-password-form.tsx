'use client';

import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { authApi } from '@/features/auth/api/auth.api';
import { useAuthStore } from '@/features/auth/hooks/use-auth-store';
import {
  changePasswordFormSchema,
  type ChangePasswordFormValues,
} from '@/features/auth/schemas/auth.schemas';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/shared/components/forms/form';
import { ContentCard } from '@/shared/components/page';

/**
 * POST /api/v1/auth/change-password — any authenticated user.
 * Backend revokes all refresh sessions; clear local session and re-login.
 */
export function ChangePasswordForm() {
  const router = useRouter();
  const clearSession = useAuthStore((s) => s.clearSession);
  const form = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordFormSchema),
    defaultValues: {
      currentPassword: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (values: ChangePasswordFormValues) => {
    try {
      await authApi.changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      toast.success('Password changed. Sign in again.');
      clearSession('logout');
      router.replace('/login/');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to change password.',
      );
    }
  };

  return (
    <ContentCard
      title="Change password"
      description="POST /api/v1/auth/change-password — all sessions are revoked after a successful change."
    >
      <Form {...form}>
        <form
          className="max-w-md space-y-4"
          noValidate
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <FormField
            control={form.control}
            name="currentPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Current password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="current-password"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="newPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>New password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <p className="text-xs text-muted-foreground">
                  Enforced by backend policy (complexity, history, breach check).
                </p>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm new password</FormLabel>
                <FormControl>
                  <Input
                    type="password"
                    autoComplete="new-password"
                    disabled={form.formState.isSubmitting}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button type="submit" disabled={form.formState.isSubmitting}>
            {form.formState.isSubmitting ? 'Updating…' : 'Change password'}
          </Button>
        </form>
      </Form>
    </ContentCard>
  );
}
