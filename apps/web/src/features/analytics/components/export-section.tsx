'use client';

import { useState } from 'react';
import { ApiError } from '@/shared/types/api';
import { Button } from '@/shared/components/ui/button';
import { ContentCard, ErrorState } from '@/shared/components/page';
import { analyticsApi } from '../api/analytics.api';
import type {
  AnalyticsExport,
  AnalyticsExportDataset,
  AnalyticsExportFormat,
} from '../schemas/analytics.schemas';
import { DateRangeFilter } from './date-range-filter';

const DATASETS: { value: AnalyticsExportDataset; label: string }[] = [
  { value: 'dashboard', label: 'Dashboard' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance' },
  { value: 'staff', label: 'Staff' },
  { value: 'vendors', label: 'Vendors' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'customers', label: 'Customers' },
  { value: 'operations', label: 'Operations' },
  { value: 'trends', label: 'Trends' },
];

const FORMATS: { value: AnalyticsExportFormat; label: string }[] = [
  { value: 'csv', label: 'CSV' },
  { value: 'xlsx', label: 'Excel (XLSX)' },
];

function base64ToArrayBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const buffer = new ArrayBuffer(binary.length);
  const bytes = new Uint8Array(buffer);
  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return buffer;
}

function triggerBrowserDownload(payload: AnalyticsExport): void {
  let blob: Blob;
  if (payload.format === 'csv') {
    blob = new Blob([payload.content], {
      type: payload.contentType || 'text/csv;charset=utf-8',
    });
  } else {
    blob = new Blob([base64ToArrayBuffer(payload.content)], {
      type:
        payload.contentType ||
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
  }

  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = payload.fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function ExportSection() {
  const [dataset, setDataset] = useState<AnalyticsExportDataset>('dashboard');
  const [format, setFormat] = useState<AnalyticsExportFormat>('csv');
  const [fromInput, setFromInput] = useState('');
  const [toInput, setToInput] = useState('');
  const [from, setFrom] = useState<string | undefined>();
  const [to, setTo] = useState<string | undefined>();
  const [isDownloading, setIsDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<{
    fileName: string;
    rowCount: number;
  } | null>(null);

  const handleDownload = async () => {
    setIsDownloading(true);
    setError(null);
    try {
      const payload = await analyticsApi.exportDataset({
        dataset,
        format,
        from,
        to,
      });
      triggerBrowserDownload(payload);
      setLastExport({ fileName: payload.fileName, rowCount: payload.rowCount });
    } catch (err) {
      const message =
        err instanceof ApiError
          ? err.message
          : err instanceof Error
            ? err.message
            : 'Export failed.';
      setError(message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <ContentCard
      title="Export Centre"
      description="Download analytics datasets as CSV or Excel-compatible SpreadsheetML (GET /api/v1/analytics/export)."
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="export-dataset"
            >
              Dataset
            </label>
            <select
              id="export-dataset"
              className="flex h-9 min-w-[10rem] rounded-md border border-input bg-card px-3 text-sm"
              value={dataset}
              onChange={(e) =>
                setDataset(e.target.value as AnalyticsExportDataset)
              }
            >
              {DATASETS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-1">
            <label
              className="text-xs font-medium text-muted-foreground"
              htmlFor="export-format"
            >
              Format
            </label>
            <select
              id="export-format"
              className="flex h-9 min-w-[8rem] rounded-md border border-input bg-card px-3 text-sm"
              value={format}
              onChange={(e) =>
                setFormat(e.target.value as AnalyticsExportFormat)
              }
            >
              {FORMATS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
          <Button
            type="button"
            size="sm"
            disabled={isDownloading}
            onClick={() => void handleDownload()}
          >
            {isDownloading ? 'Downloading…' : 'Download'}
          </Button>
        </div>

        <DateRangeFilter
          idPrefix="export"
          fromInput={fromInput}
          toInput={toInput}
          onFromChange={setFromInput}
          onToChange={setToInput}
          onApply={() => {
            setFrom(fromInput.trim() || undefined);
            setTo(toInput.trim() || undefined);
          }}
          onClear={() => {
            setFromInput('');
            setToInput('');
            setFrom(undefined);
            setTo(undefined);
          }}
        />

        {error ? (
          <ErrorState
            title="Export failed"
            description={error}
            onRetry={() => void handleDownload()}
          />
        ) : null}

        {lastExport && !error ? (
          <p className="text-sm text-muted-foreground">
            Downloaded <span className="font-medium">{lastExport.fileName}</span>
            {' · '}
            {lastExport.rowCount} row{lastExport.rowCount === 1 ? '' : 's'}
          </p>
        ) : null}
      </div>
    </ContentCard>
  );
}
