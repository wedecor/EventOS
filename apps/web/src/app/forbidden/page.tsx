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
import { useAuth } from '@/features/auth';

export default function ForbiddenPage() {
  const { user, isAuthenticated } = useAuth();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Access denied</CardTitle>
          <CardDescription>
            You do not have permission to view this page
            {user ? ` (role: ${user.role})` : ''}.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-2">
          {isAuthenticated ? (
            <Button asChild className="w-full">
              <Link href="/app/">Back to home</Link>
            </Button>
          ) : (
            <Button asChild className="w-full">
              <Link href="/login/">Go to sign in</Link>
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
