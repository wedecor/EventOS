'use client';

import Link from 'next/link';
import { PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUiStore } from '@/shared/hooks/use-ui-store';
import { Button } from '@/shared/components/ui/button';
import { env } from '@/lib/env';
import { SidebarNav } from './sidebar-nav';

type SidebarProps = {
  className?: string;
};

/** Desktop / tablet sidebar (hidden below md; mobile uses sheet). */
export function Sidebar({ className }: SidebarProps) {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useUiStore((s) => s.toggleSidebar);

  return (
    <aside
      className={cn(
        'hidden h-full shrink-0 flex-col border-r border-border bg-card transition-[width] duration-200 md:flex',
        collapsed ? 'w-16' : 'w-60',
        className,
      )}
    >
      <div className="flex h-14 items-center justify-between gap-2 border-b border-border px-3">
        {!collapsed && (
          <Link
            href="/app/"
            className="truncate text-sm font-semibold text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {env.NEXT_PUBLIC_APP_NAME}
          </Link>
        )}
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-pressed={collapsed}
        >
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      <SidebarNav collapsed={collapsed} />
      <div className="border-t border-border p-3 text-center text-[11px] text-muted-foreground">
        {!collapsed ? 'Phase 1 Admin' : 'EO'}
      </div>
    </aside>
  );
}
