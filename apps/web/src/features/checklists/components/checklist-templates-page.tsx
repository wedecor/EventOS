'use client';

import { useMemo, useState } from 'react';
import type { ColumnDef } from '@tanstack/react-table';
import { Can, RequirePermission } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Breadcrumbs } from '@/shared/components/layout/breadcrumbs';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import { Badge } from '@/shared/components/ui/badge';
import { DataTable } from '@/shared/components/data-display/data-table';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
  PageHeader,
  PageLayout,
  PageSection,
} from '@/shared/components/page';
import { buildBreadcrumbs } from '@/shared/lib/breadcrumbs';
import { usePathname } from 'next/navigation';
import {
  CHECKLIST_TEMPLATE_STATUSES,
  TASK_CATEGORIES,
  useAddChecklistTemplateItemMutation,
  useArchiveChecklistTemplateMutation,
  useChecklistTemplateQuery,
  useChecklistTemplatesQuery,
  useCreateChecklistTemplateMutation,
  useDuplicateChecklistTemplateMutation,
  useUpdateChecklistTemplateMutation,
  type ChecklistTemplate,
  type ChecklistTemplateStatus,
  type TaskCategory,
} from '../index';

const selectClassName =
  'flex h-9 rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm';

function formatLabel(value: string): string {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

/**
 * Checklist template management — Settings / Templates (P2-02).
 */
export function ChecklistTemplatesPage() {
  const pathname = usePathname() ?? '/app/settings/templates/';
  const crumbs = buildBreadcrumbs(pathname);
  const [statusFilter, setStatusFilter] = useState<
    '' | ChecklistTemplateStatus
  >('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('pre_event');
  const [eventTypes, setEventTypes] = useState('');
  const [itemTitle, setItemTitle] = useState('');

  const listQuery = useChecklistTemplatesQuery(
    statusFilter || undefined,
  );
  const detailQuery = useChecklistTemplateQuery(selectedId);
  const createMutation = useCreateChecklistTemplateMutation();
  const updateMutation = useUpdateChecklistTemplateMutation();
  const archiveMutation = useArchiveChecklistTemplateMutation();
  const duplicateMutation = useDuplicateChecklistTemplateMutation();
  const addItemMutation = useAddChecklistTemplateItemMutation(selectedId ?? '');

  const templates = listQuery.data ?? [];
  const selected = detailQuery.data;

  const columns: ColumnDef<ChecklistTemplate>[] = useMemo(
    () => [
      { accessorKey: 'name', header: 'Name' },
      {
        accessorKey: 'category',
        header: 'Category',
        cell: ({ row }) => formatLabel(row.original.category),
      },
      {
        accessorKey: 'status',
        header: 'Status',
        cell: ({ row }) => (
          <Badge>{formatLabel(row.original.status)}</Badge>
        ),
      },
      {
        accessorKey: 'templateVersion',
        header: 'Version',
      },
      {
        id: 'items',
        header: 'Items',
        cell: ({ row }) => row.original.items.length,
      },
      {
        id: 'actions',
        header: '',
        cell: ({ row }) => (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedId(row.original.id)}
          >
            Edit
          </Button>
        ),
      },
    ],
    [],
  );

  const onCreate = async () => {
    if (!name.trim()) return;
    try {
      const created = await createMutation.mutateAsync({
        name: name.trim(),
        description: description.trim() || undefined,
        category,
        eventTypes: eventTypes
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
      });
      toast.success('Template created');
      setName('');
      setDescription('');
      setEventTypes('');
      setSelectedId(created.id);
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : 'Unable to create template.',
      );
    }
  };

  return (
    <RequirePermission permission="checklists:read">
      <PageLayout>
        <PageHeader
          title="Checklist templates"
          description="Reusable checklist templates for event execution. Generated event checklists are independent copies."
          breadcrumbs={<Breadcrumbs items={crumbs} />}
        />

        <PageSection>
          <ContentCard title="Filters">
            <select
              className={selectClassName}
              value={statusFilter}
              onChange={(e) =>
                setStatusFilter(e.target.value as '' | ChecklistTemplateStatus)
              }
            >
              <option value="">All statuses</option>
              {CHECKLIST_TEMPLATE_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {formatLabel(status)}
                </option>
              ))}
            </select>
          </ContentCard>
        </PageSection>

        <PageSection>
          <Can permission="checklists:write">
            <ContentCard title="Create template">
              <div className="grid gap-2 sm:grid-cols-2">
                <Input
                  placeholder="Template name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
                <select
                  className={selectClassName}
                  value={category}
                  onChange={(e) =>
                    setCategory(e.target.value as TaskCategory)
                  }
                >
                  {TASK_CATEGORIES.map((c) => (
                    <option key={c} value={c}>
                      {formatLabel(c)}
                    </option>
                  ))}
                </select>
                <Input
                  placeholder="Description (optional)"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                />
                <Input
                  placeholder="Event types (comma-separated, empty = all)"
                  value={eventTypes}
                  onChange={(e) => setEventTypes(e.target.value)}
                />
              </div>
              <Button
                className="mt-3"
                onClick={() => void onCreate()}
                disabled={createMutation.isPending || !name.trim()}
              >
                Create
              </Button>
            </ContentCard>
          </Can>
        </PageSection>

        <PageSection>
          {listQuery.isLoading ? (
            <LoadingState variant="skeleton" rows={6} />
          ) : null}
          {listQuery.isError ? (
            <ErrorState
              title="Unable to load templates"
              description="Checklist templates could not be loaded."
              onRetry={() => void listQuery.refetch()}
            />
          ) : null}
          {!listQuery.isLoading && !listQuery.isError && templates.length === 0 ? (
            <EmptyState
              title="No checklist templates"
              description="Create a reusable template to generate event checklists."
            />
          ) : null}
          {!listQuery.isLoading && !listQuery.isError && templates.length > 0 ? (
            <ContentCard title="Templates">
              <DataTable columns={columns} data={templates} />
            </ContentCard>
          ) : null}
        </PageSection>

        {selectedId && selected ? (
          <PageSection>
            <ContentCard
              title={`${selected.name} (v${selected.templateVersion})`}
            >
              <div className="mb-3 flex flex-wrap gap-2">
                <Badge>{formatLabel(selected.status)}</Badge>
                <Badge>{formatLabel(selected.category)}</Badge>
                {selected.eventTypes.length > 0 ? (
                  <Badge>{selected.eventTypes.join(', ')}</Badge>
                ) : (
                  <Badge>All event types</Badge>
                )}
              </div>

              <Can permission="checklists:write">
                <div className="mb-4 flex flex-wrap gap-2">
                  {selected.status !== 'archived' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={archiveMutation.isPending}
                      onClick={() => {
                        void archiveMutation
                          .mutateAsync({
                            id: selected.id,
                            version: selected.version,
                          })
                          .then(() => toast.success('Template archived'))
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Unable to archive.',
                            ),
                          );
                      }}
                    >
                      Archive
                    </Button>
                  ) : null}
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={duplicateMutation.isPending}
                    onClick={() => {
                      void duplicateMutation
                        .mutateAsync(selected.id)
                        .then((dup) => {
                          toast.success(
                            `Duplicated as version ${dup.templateVersion}`,
                          );
                          setSelectedId(dup.id);
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to duplicate.',
                          ),
                        );
                    }}
                  >
                    Duplicate (new version)
                  </Button>
                  {selected.status === 'inactive' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => {
                        void updateMutation
                          .mutateAsync({
                            id: selected.id,
                            body: { status: 'active' },
                            version: selected.version,
                          })
                          .then(() => toast.success('Template activated'))
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Unable to activate.',
                            ),
                          );
                      }}
                    >
                      Activate
                    </Button>
                  ) : null}
                  {selected.status === 'active' ? (
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={updateMutation.isPending}
                      onClick={() => {
                        void updateMutation
                          .mutateAsync({
                            id: selected.id,
                            body: { status: 'inactive' },
                            version: selected.version,
                          })
                          .then(() => toast.success('Template deactivated'))
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Unable to deactivate.',
                            ),
                          );
                      }}
                    >
                      Deactivate
                    </Button>
                  ) : null}
                </div>

                {selected.status !== 'archived' ? (
                  <form
                    className="mb-4 flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      if (!itemTitle.trim()) return;
                      void addItemMutation
                        .mutateAsync({ title: itemTitle.trim() })
                        .then(() => {
                          toast.success('Item added');
                          setItemTitle('');
                        })
                        .catch((err) =>
                          toast.error(
                            err instanceof ApiError
                              ? err.message
                              : 'Unable to add item.',
                          ),
                        );
                    }}
                  >
                    <Input
                      placeholder="New item title"
                      value={itemTitle}
                      onChange={(e) => setItemTitle(e.target.value)}
                    />
                    <Button type="submit" disabled={addItemMutation.isPending}>
                      Add item
                    </Button>
                  </form>
                ) : null}
              </Can>

              <ul className="space-y-2 text-sm">
                {selected.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex items-start justify-between gap-2 border-b border-border/60 pb-2 last:border-0"
                  >
                    <div>
                      <p className="font-medium">{item.title}</p>
                      {item.description ? (
                        <p className="text-muted-foreground">
                          {item.description}
                        </p>
                      ) : null}
                    </div>
                    <Badge>
                      {item.isRequired ? 'Required' : 'Optional'}
                    </Badge>
                  </li>
                ))}
                {selected.items.length === 0 ? (
                  <p className="text-muted-foreground">No items yet.</p>
                ) : null}
              </ul>
            </ContentCard>
          </PageSection>
        ) : null}
      </PageLayout>
    </RequirePermission>
  );
}
