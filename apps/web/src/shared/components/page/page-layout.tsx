import { cn } from '@/lib/utils';

type PageLayoutProps = {
  children: React.ReactNode;
  className?: string;
};

/** Standard page content wrapper used by every module. */
export function PageLayout({ children, className }: PageLayoutProps) {
  return (
    <div className={cn('mx-auto flex w-full max-w-[1600px] flex-1 flex-col gap-6 p-4 sm:p-6', className)}>
      {children}
    </div>
  );
}
