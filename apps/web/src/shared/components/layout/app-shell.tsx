'use client';

import { Header } from './header';
import { Sidebar } from './sidebar';

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-dvh overflow-hidden bg-background">
      <Sidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Header />
        <main id="main-content" className="flex-1 overflow-y-auto focus:outline-none" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}
