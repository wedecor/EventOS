'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { resolveDefaultAppHref, useAuth } from '@/features/auth';
import { roleHasPermission } from '@/shared/auth/rbac';
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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { env } from '@/lib/env';
import {
  loginFormSchema,
  type LoginFormValues,
} from '../schemas/auth.schemas';

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const submitting = form.formState.isSubmitting;

  const onSubmit = form.handleSubmit(async (values) => {
    form.clearErrors('root');
    try {
      const session = await login(values);
      toast.success('Signed in');
      router.replace(
        resolveDefaultAppHref((permission) =>
          roleHasPermission(session.user.role, permission),
        ),
      );
    } catch (error) {
      const message =
        error instanceof ApiError
          ? error.message
          : 'Unable to sign in. Check credentials and API availability.';
      form.setError('root', { message });
      toast.error(message);
    }
  });

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{env.NEXT_PUBLIC_APP_NAME}</CardTitle>
        <CardDescription>Sign in to the Admin Portal</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input
                      type="email"
                      autoComplete="username"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      autoComplete="current-password"
                      disabled={submitting}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {form.formState.errors.root ? (
              <p className="text-sm text-destructive" role="alert">
                {form.formState.errors.root.message}
              </p>
            ) : null}
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                'Sign in'
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
