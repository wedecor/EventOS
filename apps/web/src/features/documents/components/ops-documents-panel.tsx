'use client';

import { useRef, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { ConfirmDialog } from '@/shared/components/feedback/confirm-dialog';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/page';
import { documentsApi, type StoredDocument } from '../api/documents.api';

type OpsDocumentsPanelProps = {
  bookingId: string;
  customerId?: string | null;
};

export function OpsDocumentsPanel({
  bookingId,
  customerId,
}: OpsDocumentsPanelProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [category, setCategory] = useState('other');
  const [deleteTarget, setDeleteTarget] = useState<StoredDocument | null>(null);

  const query = useQuery({
    queryKey: ['ops-documents', bookingId],
    queryFn: () => documentsApi.list({ bookingId }),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) =>
      documentsApi.upload({
        file,
        category,
        bookingId,
        customerId: customerId ?? undefined,
      }),
    onSuccess: async () => {
      toast.success('Document uploaded');
      await queryClient.invalidateQueries({
        queryKey: ['ops-documents', bookingId],
      });
      if (fileRef.current) fileRef.current.value = '';
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Upload failed.',
      );
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (doc: StoredDocument) =>
      documentsApi.remove(doc.id, doc.version),
    onSuccess: async () => {
      toast.success('Document deleted');
      setDeleteTarget(null);
      await queryClient.invalidateQueries({
        queryKey: ['ops-documents', bookingId],
      });
    },
    onError: (error) => {
      toast.error(
        error instanceof ApiError ? error.message : 'Delete failed.',
      );
    },
  });

  return (
    <ContentCard
      title="Event documents"
      description="Upload contracts, reference images, and booking attachments (binary storage)."
    >
      {query.isLoading ? <LoadingState label="Loading documents…" /> : null}
      {query.isError ? (
        <ErrorState
          title="Unable to load documents"
          description={
            query.error instanceof ApiError
              ? query.error.message
              : 'Request failed.'
          }
        />
      ) : null}

      {query.isSuccess && query.data.length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Upload a PDF or image linked to this booking."
        />
      ) : null}

      {query.isSuccess && query.data.length > 0 ? (
        <ul className="space-y-2">
          {query.data.map((doc) => (
            <li
              key={doc.id}
              className="flex flex-wrap items-center justify-between gap-2 border-b border-border py-2 text-sm"
            >
              <div>
                <div className="font-medium">{doc.fileName}</div>
                <div className="text-xs text-muted-foreground">
                  {doc.category} · {(doc.fileSizeBytes / 1024).toFixed(1)} KB
                </div>
              </div>
              <div className="flex gap-2">
                <Can permission="documents:read">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      void documentsApi
                        .download(doc.id, doc.fileName)
                        .then(() => toast.success('Download started'))
                        .catch((error: unknown) =>
                          toast.error(
                            error instanceof ApiError
                              ? error.message
                              : 'Download failed.',
                          ),
                        );
                    }}
                  >
                    Download
                  </Button>
                </Can>
                <Can permission="documents:write">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    onClick={() => setDeleteTarget(doc)}
                  >
                    Delete
                  </Button>
                </Can>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Can permission="documents:write">
        <div className="mt-4 flex flex-wrap items-end gap-3">
          <label className="text-sm">
            <span className="mb-1 block text-muted-foreground">Category</span>
            <select
              className="flex h-9 rounded-md border border-input bg-transparent px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="contract">Contract</option>
              <option value="event_image">Event image</option>
              <option value="customer_document">Customer document</option>
              <option value="other">Other</option>
            </select>
          </label>
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,image/jpeg,image/png,image/webp"
            className="text-sm"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) uploadMutation.mutate(file);
            }}
          />
          {uploadMutation.isPending ? (
            <span className="text-sm text-muted-foreground">Uploading…</span>
          ) : null}
        </div>
      </Can>

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Delete document?"
        description="Removes the file from storage and soft-deletes metadata."
        confirmLabel="Delete"
        onConfirm={() => {
          if (deleteTarget) deleteMutation.mutate(deleteTarget);
        }}
      />
    </ContentCard>
  );
}
