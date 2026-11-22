'use client';

import { Can } from '@/features/auth';
import { ApiError } from '@/shared/types/api';
import { Button } from '@/shared/components/ui/button';
import {
  ContentCard,
  EmptyState,
  ErrorState,
  LoadingState,
} from '@/shared/components/page';
import { useGenerateLeadIntelligenceMutation } from '../hooks/use-lead-queries';
import type { LeadIntelligenceResponse } from '../schemas/lead-intelligence.schemas';

function EvidenceBadge({ evidence }: { evidence: string }) {
  const label =
    evidence === 'explicit'
      ? 'Explicit'
      : evidence === 'inferred'
        ? 'Inferred'
        : 'Unknown';
  return (
    <span className="ml-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
      {label}
    </span>
  );
}

function FieldRow({
  label,
  value,
  evidence,
}: {
  label: string;
  value: string;
  evidence: string;
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-b border-border/60 py-2 last:border-0">
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="text-sm">
        {value}
        <EvidenceBadge evidence={evidence} />
      </dd>
    </div>
  );
}

function IntelligenceBody({ data }: { data: LeadIntelligenceResponse }) {
  const intel = data.intelligence;
  const budgetText =
    intel.budget.value == null
      ? '—'
      : `${intel.budget.value.amount} ${intel.budget.value.currency}`;

  return (
    <div className="space-y-4">
      <p className="text-sm leading-relaxed">{intel.summary}</p>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Event requirements</h4>
        <dl>
          <FieldRow
            label="Event type"
            value={intel.eventType.value ?? '—'}
            evidence={intel.eventType.evidence}
          />
          <FieldRow
            label="Event start"
            value={intel.eventDate.start.value ?? '—'}
            evidence={intel.eventDate.start.evidence}
          />
          <FieldRow
            label="Event end"
            value={intel.eventDate.end.value ?? '—'}
            evidence={intel.eventDate.end.evidence}
          />
          <FieldRow
            label="Venue"
            value={intel.venue.value ?? '—'}
            evidence={intel.venue.evidence}
          />
          <FieldRow
            label="Budget"
            value={budgetText}
            evidence={intel.budget.evidence}
          />
          <FieldRow
            label="Guest count"
            value={
              intel.guestCount.value === null
                ? '—'
                : String(intel.guestCount.value)
            }
            evidence={intel.guestCount.evidence}
          />
        </dl>
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Known requirements</h4>
        {intel.knownRequirements.length === 0 ? (
          <p className="text-sm text-muted-foreground">None captured.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {intel.knownRequirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Missing information</h4>
        {intel.missingInformation.length === 0 ? (
          <p className="text-sm text-muted-foreground">No gaps flagged.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {intel.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </div>

      <div>
        <h4 className="mb-1 text-sm font-semibold">Qualification questions</h4>
        <ul className="list-disc space-y-1 pl-5 text-sm">
          {intel.suggestedQualificationQuestions.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <p className="text-sm">
        <span className="font-medium">Suggested priority:</span>{' '}
        {intel.suggestedFollowUpPriority}
      </p>

      {intel.confidenceNotes ? (
        <p className="text-xs text-muted-foreground">{intel.confidenceNotes}</p>
      ) : null}

      <p className="text-xs text-muted-foreground">
        Read-only advisory · {data.provider}/{data.model} · {data.promptVersion}.
        Values are not saved to the lead — copy or act manually if needed.
      </p>
    </div>
  );
}

export function LeadIntelligencePanel({ leadId }: { leadId: string }) {
  const mutation = useGenerateLeadIntelligenceMutation(leadId);

  return (
    <Can everyOf={['leads:read', 'ai:use']}>
      <ContentCard
        title="AI Intelligence"
        description="Advisory only — does not change this lead, create quotations, send email, or record payments. Review every suggestion before acting."
      >
        <div className="mb-4 flex flex-col gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={mutation.isPending}
            onClick={() => mutation.mutate()}
          >
            {mutation.data ? 'Regenerate' : 'Generate intelligence'}
          </Button>
          <p className="text-xs text-muted-foreground">
            Unknown fields stay blank on purpose. Do not treat inferred notes as
            confirmed customer commitments.
          </p>
        </div>

        {!mutation.data && !mutation.isPending && !mutation.isError ? (
          <EmptyState
            title="No intelligence yet"
            description="Generate a structured summary, gaps, and qualification questions from authorized lead context. Nothing is written back to the lead."
          />
        ) : null}

        {mutation.isPending ? (
          <LoadingState variant="skeleton" rows={5} />
        ) : null}

        {mutation.isError ? (
          <ErrorState
            title="Unable to generate intelligence"
            description={
              mutation.error instanceof ApiError
                ? mutation.error.message
                : 'Request failed.'
            }
            onRetry={() => mutation.mutate()}
          />
        ) : null}

        {mutation.data && !mutation.isPending ? (
          <IntelligenceBody data={mutation.data} />
        ) : null}
      </ContentCard>
    </Can>
  );
}
