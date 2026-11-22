'use client';

import Link from 'next/link';
import { Button } from '@/shared/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/shared/components/ui/card';
import { useAuthStore } from '@/features/auth';

export default function UnauthorizedPage() {
  const reason = useAuthStore((s) => s.sessionEndReason);

  const description =
    reason === 'expired'
      ? 'Your session expired. Sign in again to continue.'
      : reason === 'unauthorized'
        ? 'Your session is no longer valid. Sign in again to continue.'
        : 'You must be signed in to access this area.';

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Session required</CardTitle>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild className="w-full">
            <Link href="/login/">Go to sign in</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
