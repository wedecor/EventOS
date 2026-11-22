import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError, apiRequest, downloadFile } from '../../shared/api/client';
import type {
  Booking,
  Quotation,
  QuotationLineItem,
} from '../../shared/types/domain';
import { StageBadge } from '../../shared/ui/StageBadge';
import { useToast } from '../../shared/ui/Toast';

export function QuotationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const toast = useToast();
  const [desc, setDesc] = useState('Decor package');
  const [qty, setQty] = useState('1');
  const [unitPrice, setUnitPrice] = useState('150000');
  const [payAmount, setPayAmount] = useState('50000');

  const quotationQuery = useQuery({
    queryKey: ['quotations', id],
    queryFn: () => apiRequest<Quotation>(`/quotations/${id}`),
    enabled: Boolean(id),
  });

  const lineItemsQuery = useQuery({
    queryKey: ['quotations', id, 'line-items'],
    queryFn: () =>
      apiRequest<QuotationLineItem[]>(`/quotations/${id}/line-items`),
    enabled: Boolean(id),
  });

  const q = quotationQuery.data;

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['quotations', id] });
    void queryClient.invalidateQueries({
      queryKey: ['quotations', id, 'line-items'],
    });
  };

  const addLine = useMutation({
    mutationFn: () =>
      apiRequest(`/quotations/${id}/line-items`, {
        method: 'POST',
        body: JSON.stringify({
          description: desc,
          quantity: Number(qty),
          unitPrice: Number(unitPrice),
        }),
      }),
    onSuccess: () => {
      invalidate();
      toast.push('Line item added');
    },
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Could not add line item',
        'error',
      ),
  });

  const recordPayment = useMutation({
    mutationFn: () =>
      apiRequest('/payments', {
        method: 'POST',
        body: JSON.stringify({
          leadId: q?.leadId,
          quotationId: id,
          amount: Number(payAmount),
          method: 'upi',
          receivedAt: new Date().toISOString(),
          paymentType: 'advance',
        }),
      }),
    onSuccess: () => toast.push('Advance payment recorded'),
    onError: (err) =>
      toast.push(
        err instanceof ApiError ? err.message : 'Payment failed',
        'error',
      ),
  });

  const send = useMutation({
    mutationFn: () =>
      apiRequest<Quotation>(`/quotations/${id}/send`, {
        method: 'POST',
        body: JSON.stringify({ version: q?.version }),
      }),
    onSuccess: () => {
      invalidate();
      toast.push('Quotation sent');
    },
  });

  const approve = useMutation({
    mutationFn: () =>
      apiRequest<Quotation>(`/quotations/${id}/approve`, {
        method: 'POST',
        body: JSON.stringify({ version: q?.version }),
      }),
    onSuccess: () => {
      invalidate();
      toast.push('Quotation approved');
    },
  });

  const createBooking = useMutation({
    mutationFn: () =>
      apiRequest<Booking>(`/bookings/from-quotation/${id}`, {
        method: 'POST',
      }),
    onSuccess: (booking) => {
      toast.push('Booking created');
      navigate(`/bookings/${booking.id}`);
    },
  });

  const lineItems = lineItemsQuery.data ?? [];

  function onLineSubmit(e: FormEvent) {
    e.preventDefault();
    addLine.mutate();
  }

  const actionError = (err: unknown) =>
    err instanceof ApiError ? err.message : null;

  return (
    <div>
      {q?.leadId ? (
        <Link
          to={`/leads/${q.leadId}`}
          className="text-sm text-brand-700 hover:underline"
        >
          ← Back to lead
        </Link>
      ) : (
        <Link to="/leads" className="text-sm text-brand-700 hover:underline">
          ← Leads
        </Link>
      )}

      {quotationQuery.isLoading ? (
        <p className="mt-6 text-slate-600">Loading…</p>
      ) : null}

      {q ? (
        <div className="mt-4 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h1 className="text-2xl font-semibold">
              Quotation #{q.quotationNumber}
              <span className="text-base font-normal text-slate-500">
                {' '}
                rev {q.revisionNumber}
              </span>
            </h1>
            <StageBadge stage={q.status} />
          </div>

          <section className="rounded-lg border border-slate-200 bg-white p-5 text-sm">
            <dl className="grid gap-2 sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Total</dt>
                <dd className="text-lg font-semibold">
                  {q.currency} {q.totalAmount.toLocaleString()}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Subtotal / GST</dt>
                <dd>
                  {q.subtotalAmount.toLocaleString()} +{' '}
                  {q.taxAmount.toLocaleString()} tax
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Version</dt>
                <dd>{q.version}</dd>
              </div>
            </dl>
            <button
              type="button"
              className="mt-4 text-sm text-brand-700 hover:underline"
              onClick={() =>
                void downloadFile(
                  `/quotations/${id}/pdf`,
                  `quotation-${q.quotationNumber}.pdf`,
                )
              }
            >
              Download PDF
            </button>
          </section>

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium">Line items</h2>
            {lineItemsQuery.isLoading ? (
              <p className="mt-2 text-sm text-slate-600">Loading…</p>
            ) : lineItems.length === 0 ? (
              <p className="mt-2 text-sm text-slate-600">No line items yet.</p>
            ) : (
              <div className="mt-3 overflow-x-auto">
                <table className="min-w-full text-left text-sm">
                  <thead className="text-slate-500">
                    <tr>
                      <th className="pb-2 font-medium">Description</th>
                      <th className="pb-2 font-medium">Qty</th>
                      <th className="pb-2 font-medium">Unit</th>
                      <th className="pb-2 font-medium text-right">Line total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lineItems.map((item) => (
                      <tr key={item.id} className="border-t border-slate-100">
                        <td className="py-2 pr-4">{item.description}</td>
                        <td className="py-2">{item.quantity}</td>
                        <td className="py-2">
                          {q.currency} {item.unitPrice.toLocaleString()}
                        </td>
                        <td className="py-2 text-right font-medium">
                          {q.currency}{' '}
                          {(item.quantity * item.unitPrice).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          {q.status === 'draft' ? (
            <section className="rounded-lg border border-slate-200 bg-white p-5">
              <h2 className="font-medium">Add line item</h2>
              <form className="mt-3 flex flex-wrap gap-3" onSubmit={onLineSubmit}>
                <input
                  className="min-w-[12rem] flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                  value={desc}
                  onChange={(e) => setDesc(e.target.value)}
                  placeholder="Description"
                />
                <input
                  className="w-20 rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <input
                  className="w-28 rounded-md border border-slate-300 px-2 py-2 text-sm"
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                />
                <button
                  type="submit"
                  className="rounded-md bg-slate-800 px-3 py-2 text-sm text-white"
                  disabled={addLine.isPending}
                >
                  Add
                </button>
              </form>
              {actionError(addLine.error) ? (
                <p className="mt-2 text-sm text-red-600">{actionError(addLine.error)}</p>
              ) : null}
            </section>
          ) : null}

          <section className="rounded-lg border border-slate-200 bg-white p-5">
            <h2 className="font-medium">W5 steps</h2>
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                type="button"
                className="rounded-md border border-slate-300 px-3 py-1.5 text-sm hover:bg-slate-50"
                disabled={recordPayment.isPending}
                onClick={() => recordPayment.mutate()}
              >
                Record advance ({payAmount})
              </button>
              <input
                className="w-24 rounded-md border border-slate-300 px-2 py-1 text-sm"
                value={payAmount}
                onChange={(e) => setPayAmount(e.target.value)}
              />
              {q.status === 'draft' && q.totalAmount > 0 ? (
                <button
                  type="button"
                  className="rounded-md bg-brand-700 px-3 py-1.5 text-sm text-white"
                  disabled={send.isPending}
                  onClick={() => send.mutate()}
                >
                  Send
                </button>
              ) : null}
              {q.status === 'sent' ? (
                <button
                  type="button"
                  className="rounded-md bg-emerald-700 px-3 py-1.5 text-sm text-white"
                  disabled={approve.isPending}
                  onClick={() => approve.mutate()}
                >
                  Approve
                </button>
              ) : null}
              {q.status === 'approved' ? (
                <button
                  type="button"
                  className="rounded-md bg-indigo-700 px-3 py-1.5 text-sm text-white"
                  disabled={createBooking.isPending}
                  onClick={() => createBooking.mutate()}
                >
                  Create booking
                </button>
              ) : null}
            </div>
            {[
              recordPayment.error,
              send.error,
              approve.error,
              createBooking.error,
            ].map((err, index) =>
              actionError(err) ? (
                <p key={index} className="mt-2 text-sm text-red-600">
                  {actionError(err)}
                </p>
              ) : null,
            )}
          </section>
        </div>
      ) : null}
    </div>
  );
}
