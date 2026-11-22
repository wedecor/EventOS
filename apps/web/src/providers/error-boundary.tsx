'use client';

import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from '@/shared/components/ui/button';

type Props = { children: ReactNode };
type State = { hasError: boolean; message?: string };

export class AppErrorBoundary extends Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('AppErrorBoundary', error, info);
  }

  override render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-6 text-center">
          <h1 className="text-xl font-semibold">Something went wrong</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {this.state.message ?? 'An unexpected error occurred in the Admin Portal.'}
          </p>
          <Button type="button" onClick={() => this.setState({ hasError: false, message: undefined })}>
            Try again
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
