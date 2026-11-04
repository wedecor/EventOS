'use client';

import { useState } from 'react';
import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { toast } from '@/shared/components/feedback/toaster';
import { Button } from '@/shared/components/ui/button';
import { Input } from '@/shared/components/ui/input';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/page';
import {
  useBookingDocumentsQuery,
  useCreateDocumentMutation,
  useDeleteDocumentMutation,
  useRejectDocumentMutation,
  useVerifyDocumentMutation,
} from '../hooks/use-finance-queries';
import {
  FINANCIAL_DOCUMENT_TYPES,
  formatDocumentType,
  type FinancialDocumentType,
} from '../schemas/finance.schemas';

export function DocumentsPanel({ bookingId }: { bookingId: string }) {
  const query = useBookingDocumentsQuery(bookingId);
  const createMutation = useCreateDocumentMutation(bookingId);
  const verifyMutation = useVerifyDocumentMutation(bookingId);
  const rejectMutation = useRejectDocumentMutation(bookingId);
  const deleteMutation = useDeleteDocumentMutation(bookingId);

  const [documentType, setDocumentType] =
    useState<FinancialDocumentType>('payment_proof');
  const [fileName, setFileName] = useState('');
  const [mimeType, setMimeType] = useState('application/pdf');
  const [storageKey, setStorageKey] = useState('');
  const [description, setDescription] = useState('');
  const [paymentId, setPaymentId] = useState('');

  const onCreate = async () => {
    try {
      await createMutation.mutateAsync({
        bookingId,
        documentType,
        ...(fileName.trim() ? { fileName: fileName.trim() } : {}),
        ...(mimeType.trim() ? { mimeType: mimeType.trim() } : {}),
        ...(storageKey.trim() ? { storageKey: storageKey.trim() } : {}),
        ...(description.trim() ? { description: description.trim() } : {}),
        ...(paymentId.trim() ? { paymentId: paymentId.trim() } : {}),
      });
      toast.success('Document metadata registered');
      setFileName('');
      setStorageKey('');
      setDescription('');
      setPaymentId('');
    } catch (error) {
      toast.error(
        error instanceof ApiError
          ? error.message
          : 'Unable to register document.',
      );
    }
  };

  return (
    <ContentCard
      title="Financial documents"
      description="Metadata only — binary upload and PDF generation are out of scope."
    >
      {query.isLoading ? <LoadingState variant="skeleton" rows={3} /> : null}
      {query.isError ? (
        <ErrorState
          title="Unable to load documents"
          description={
            query.error instanceof ApiError
              ? query.error.message
              : 'Request failed.'
          }
          onRetry={() => void query.refetch()}
        />
      ) : null}
      {!query.isLoading && !query.isError && (query.data ?? []).length === 0 ? (
        <EmptyState
          title="No documents yet"
          description="Register payment proofs, receipts, and invoice metadata here."
        />
      ) : null}

      {(query.data ?? []).length > 0 ? (
        <ul className="mb-4 space-y-2">
          {(query.data ?? []).map((doc) => (
            <li
              key={doc.id}
              className="rounded-md border border-border p-3 text-sm"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium">
                    {formatDocumentType(doc.documentType)} ·{' '}
                    {doc.verificationStatus}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {doc.fileName ?? 'No file name'}
                    {doc.mimeType ? ` · ${doc.mimeType}` : ''}
                    {doc.storageKey ? ` · ${doc.storageKey}` : ''}
                  </p>
                  {doc.description ? (
                    <p className="mt-1 text-xs">{doc.description}</p>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2">
                  {doc.verificationStatus === 'pending' ? (
                    <Can permission="documents:verify">
                      <Button
                        type="button"
                        size="sm"
                        disabled={verifyMutation.isPending}
                        onClick={() =>
                          void verifyMutation
                            .mutateAsync({
                              id: doc.id,
                              body: {},
                              version: doc.version,
                            })
                            .then(() => toast.success('Verified'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Verify failed',
                              ),
                            )
                        }
                      >
                        Verify
                      </Button>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        disabled={rejectMutation.isPending}
                        onClick={() =>
                          void rejectMutation
                            .mutateAsync({
                              id: doc.id,
                              body: { verificationNotes: 'Rejected from UI' },
                              version: doc.version,
                            })
                            .then(() => toast.success('Rejected'))
                            .catch((err) =>
                              toast.error(
                                err instanceof ApiError
                                  ? err.message
                                  : 'Reject failed',
                              ),
                            )
                        }
                      >
                        Reject
                      </Button>
                    </Can>
                  ) : null}
                  <Can permission="documents:write">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      disabled={deleteMutation.isPending}
                      onClick={() =>
                        void deleteMutation
                          .mutateAsync({
                            id: doc.id,
                            version: doc.version,
                          })
                          .then(() => toast.success('Document removed'))
                          .catch((err) =>
                            toast.error(
                              err instanceof ApiError
                                ? err.message
                                : 'Delete failed',
                            ),
                          )
                      }
                    >
                      Delete
                    </Button>
                  </Can>
                </div>
              </div>
            </li>
          ))}
        </ul>
      ) : null}

      <Can permission="documents:write">
        <div className="grid gap-2 sm:grid-cols-2">
          <select
            className="h-9 rounded-md border border-input bg-background px-3 text-sm"
            value={documentType}
            onChange={(e) =>
              setDocumentType(e.target.value as FinancialDocumentType)
            }
          >
            {FINANCIAL_DOCUMENT_TYPES.map((type) => (
              <option key={type} value={type}>
                {formatDocumentType(type)}
              </option>
            ))}
          </select>
          <Input
            placeholder="File name"
            value={fileName}
            onChange={(e) => setFileName(e.target.value)}
          />
          <Input
            placeholder="MIME type"
            value={mimeType}
            onChange={(e) => setMimeType(e.target.value)}
          />
          <Input
            placeholder="Storage key (metadata)"
            value={storageKey}
            onChange={(e) => setStorageKey(e.target.value)}
          />
          <Input
            placeholder="Optional payment UUID"
            value={paymentId}
            onChange={(e) => setPaymentId(e.target.value)}
          />
          <Input
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <Button
          type="button"
          className="mt-3"
          disabled={createMutation.isPending}
          onClick={() => void onCreate()}
        >
          Register document metadata
        </Button>
      </Can>
    </ContentCard>
  );
}
