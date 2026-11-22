import { PageHeader } from '@/shared/components/page/page-header';
import { PageLayout } from '@/shared/components/page/page-layout';

type PageContainerProps = {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  breadcrumbs?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
};

/** @deprecated Prefer PageLayout + PageHeader from `@/shared/components/page`. */
export function PageContainer({
  title,
  description,
  actions,
  breadcrumbs,
  children,
  className,
}: PageContainerProps) {
  return (
    <PageLayout className={className}>
      <PageHeader
        title={title}
        description={description}
        actions={actions}
        breadcrumbs={breadcrumbs}
      />
      {children}
    </PageLayout>
  );
}
