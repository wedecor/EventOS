'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { MAIN_NAV, type NavItem } from '@/shared/config/navigation';
import { NAV_ICONS } from '@/shared/config/nav-icons';
import { useUiStore } from '@/shared/hooks/use-ui-store';
import { usePermissions } from '@/features/auth';
import {
  filterNavByPermissions,
  isNavActive,
} from '@/features/auth/lib/filter-nav';
import { Button } from '@/shared/components/ui/button';

type SidebarNavProps = {
  collapsed: boolean;
  onNavigate?: () => void;
};

function NavLeaf({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const Icon = NAV_ICONS[item.icon];
  const active = isNavActive(pathname, item.href);
  if (!item.href) return null;

  return (
    <Link
      href={item.href}
      onClick={onNavigate}
      aria-current={active ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
        active
          ? 'bg-accent font-medium text-accent-foreground'
          : 'text-foreground hover:bg-muted',
        collapsed && 'justify-center px-0',
      )}
      title={item.label}
    >
      <Icon className="h-4 w-4 shrink-0" aria-hidden />
      {!collapsed && <span className="truncate">{item.label}</span>}
      {collapsed && <span className="sr-only">{item.label}</span>}
    </Link>
  );
}

function NavGroup({
  item,
  collapsed,
  onNavigate,
}: {
  item: NavItem;
  collapsed: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname() ?? '';
  const expandedNavIds = useUiStore((s) => s.expandedNavIds);
  const toggleNavGroup = useUiStore((s) => s.toggleNavGroup);
  const setNavGroupExpanded = useUiStore((s) => s.setNavGroupExpanded);
  const Icon = NAV_ICONS[item.icon];
  const children = item.children ?? [];
  const childActive = children.some((c) => isNavActive(pathname, c.href));
  const expanded = expandedNavIds.includes(item.id) || childActive;

  useEffect(() => {
    if (childActive) {
      setNavGroupExpanded(item.id, true);
    }
  }, [childActive, item.id, setNavGroupExpanded]);

  if (collapsed) {
    return (
      <div className="space-y-1">
        <div
          className="flex justify-center rounded-md px-0 py-2 text-muted-foreground"
          title={item.label}
        >
          <Icon className="h-4 w-4" aria-hidden />
          <span className="sr-only">{item.label}</span>
        </div>
        {children.map((child) => (
          <NavLeaf key={child.id} item={child} collapsed onNavigate={onNavigate} />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <Button
        type="button"
        variant="ghost"
        className={cn(
          'h-auto w-full justify-between px-3 py-2 font-normal',
          childActive && 'bg-muted/60',
        )}
        aria-expanded={expanded}
        onClick={() => toggleNavGroup(item.id)}
      >
        <span className="flex items-center gap-3">
          <Icon className="h-4 w-4 shrink-0" aria-hidden />
          <span className="truncate text-sm">{item.label}</span>
        </span>
        <ChevronDown
          className={cn('h-4 w-4 transition-transform', expanded && 'rotate-180')}
          aria-hidden
        />
      </Button>
      {expanded ? (
        <div className="ml-3 space-y-1 border-l border-border pl-2">
          {children.map((child) => (
            <NavLeaf key={child.id} item={child} collapsed={false} onNavigate={onNavigate} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

export function SidebarNav({ collapsed, onNavigate }: SidebarNavProps) {
  const { hasPermission } = usePermissions();
  const items = filterNavByPermissions(MAIN_NAV, hasPermission);

  return (
    <nav className="flex-1 space-y-1 overflow-y-auto p-2" aria-label="Primary">
      {items.map((item) =>
        item.children?.length ? (
          <NavGroup key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ) : (
          <NavLeaf key={item.id} item={item} collapsed={collapsed} onNavigate={onNavigate} />
        ),
      )}
    </nav>
  );
}
