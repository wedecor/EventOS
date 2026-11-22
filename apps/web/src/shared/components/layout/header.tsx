'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  Bell,
  LogOut,
  Menu,
  Moon,
  Settings,
  Shield,
  Sun,
  UserRound,
} from 'lucide-react';
import { useTheme } from 'next-themes';
import { Can, useAuth } from '@/features/auth';
import { Button } from '@/shared/components/ui/button';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import { toast } from '@/shared/components/feedback/toaster';
import { Avatar, AvatarFallback } from '@/shared/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/shared/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/shared/components/ui/sheet';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { SidebarNav } from '@/shared/components/layout/sidebar-nav';
import { useUiStore } from '@/shared/hooks/use-ui-store';
import { buildBreadcrumbs, ROUTE_TITLES } from '@/shared/lib/breadcrumbs';
import { env } from '@/lib/env';

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('');
}

function pageTitleFromPath(pathname: string): string {
  const parts = pathname.replace(/\/+$/, '').split('/').filter(Boolean);
  const last = parts[parts.length - 1] ?? 'dashboard';
  return ROUTE_TITLES[last] ?? last;
}

export function Header() {
  const { user, logout } = useAuth();
  const { theme, setTheme } = useTheme();
  const router = useRouter();
  const pathname = usePathname() ?? '/app/';
  const mobileNavOpen = useUiStore((s) => s.mobileNavOpen);
  const setMobileNavOpen = useUiStore((s) => s.setMobileNavOpen);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const crumbs = buildBreadcrumbs(pathname);
  const pageTitle = pageTitleFromPath(pathname);

  return (
    <>
      <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center gap-3 border-b border-border bg-card/95 px-3 backdrop-blur supports-[backdrop-filter]:bg-card/80 sm:px-4">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="md:hidden"
          aria-label="Open navigation"
          onClick={() => setMobileNavOpen(true)}
        >
          <Menu className="h-5 w-5" />
        </Button>

        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold sm:hidden">{pageTitle}</p>
          <div className="hidden sm:block">
            <Breadcrumbs items={crumbs} />
          </div>
        </div>

        <div className="flex items-center gap-1 sm:gap-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="Notifications (coming soon)"
            disabled
            title="Notifications — coming later"
          >
            <Bell className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="relative"
            aria-label="Toggle theme"
            onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          >
            <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
            <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="gap-2 px-2"
                aria-label="User menu"
              >
                <Avatar className="h-8 w-8">
                  <AvatarFallback>{user ? initials(user.name) : '?'}</AvatarFallback>
                </Avatar>
                <span className="hidden max-w-[10rem] truncate text-sm font-medium lg:inline">
                  {user?.name ?? 'Account'}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{user?.name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                  <p className="text-xs text-muted-foreground">{user?.role}</p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <Can permission="settings:read">
                <DropdownMenuItem asChild>
                  <Link href="/app/settings/">
                    <Settings className="h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </Can>
              <DropdownMenuItem asChild>
                <Link href="/app/settings/security/">
                  <Shield className="h-4 w-4" />
                  Security
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem disabled>
                <UserRound className="h-4 w-4" />
                Profile (soon)
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onSelect={() => setConfirmOpen(true)}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
        <SheetContent side="left" className="p-0">
          <SheetHeader>
            <SheetTitle>{env.NEXT_PUBLIC_APP_NAME}</SheetTitle>
          </SheetHeader>
          <SidebarNav collapsed={false} onNavigate={() => setMobileNavOpen(false)} />
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        title="Sign out?"
        description="You will need to sign in again to access the Admin Portal."
        confirmLabel="Sign out"
        cancelLabel="Stay signed in"
        destructive
        loading={loggingOut}
        onConfirm={async () => {
          setLoggingOut(true);
          try {
            await logout();
            toast.success('Signed out');
            setConfirmOpen(false);
            router.replace('/login/');
          } catch {
            toast.error('Signed out locally. Server logout may have failed.');
            setConfirmOpen(false);
            router.replace('/login/');
          } finally {
            setLoggingOut(false);
          }
        }}
      />
    </>
  );
}
