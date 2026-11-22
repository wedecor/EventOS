# Event OS — Object Storage Integration (Repository Preparation)

> **R2-09 scope:** repository-side preparation only.
> This directory does **not** add an S3/MinIO SDK, upload endpoints, signed URLs,
> create buckets, or change `apps/api` / Prisma.
> It documents how operators should provision **S3-compatible** object storage
> before a later task wires the File module (Engineering Backlog R2-09 AC/DoD:
> bootstrap validation + upload round-trip — **deferred to application wiring**).

Authoritative references:

- [docs/16-deployment-strategy.md](../../docs/16-deployment-strategy.md) — `STORAGE_*` env vars
- [docs/10-implementation-specification.md](../../docs/10-implementation-specification.md) — §File Storage Strategy
- [docs/09-api-design.md](../../docs/09-api-design.md) — §File Upload Strategy (future `POST /api/v1/files/upload`)
- [docs/14-security-principles.md](../../docs/14-security-principles.md) — §File Upload Security, encryption at rest
- [docs/08-data-model.md](../../docs/08-data-model.md) — Attachment AR / soft delete
- [infrastructure/staging/.env.staging.example](../staging/.env.staging.example) — staging placeholders

Phase 1 attachment use cases (business + API docs):

| Use case | Typical module path segment | EP1 / docs notes |
|----------|----------------------------|------------------|
| Quotation attachments | `quotation` | Supporting docs on quotes |
| Vendor invoices / bills | `vendor` / `procurement` | Vendor management proofs |
| Expense receipts | `finance` / `expense` | VendorExpense + proofs |
| Payment proofs | `payment` | EP1-FIN-003 |
| Event photos / gallery | `event` / `content` | Content library / marketing |
| Inventory movement photos | `inventory` | EP1-INV-007 |
| Generic documents | `document` | Catch-all tenant docs |

---

## What “done” means in this repo vs later wiring

| Layer | R2-09 (this directory) | Later application task (out of scope here) |
|-------|------------------------|---------------------------------------------|
| Docs / templates | ✅ | — |
| `STORAGE_*` in staging example | ✅ (already present; refined here) | Validate in `env.schema` at bootstrap |
| SDK + upload API | ❌ | File module + `POST /api/v1/files/upload` |
| Signed URL download | ❌ | Per docs/10 / docs/14 (1h default expiry) |
| Bucket creation / IAM | ❌ | Operator / cloud console |

---

## Compatible providers (S3 API)

Any **S3-compatible** endpoint works with the same env contract (docs/16):

| Provider | Typical `STORAGE_ENDPOINT` shape | Notes |
|----------|----------------------------------|--------|
| **AWS S3** | `https://s3.<region>.amazonaws.com` or regional virtual-host style | Set region in client config when wiring SDK later |
| **MinIO** | `http(s)://<host>:<port>` | Common for local/dev; use TLS in staging/prod |
| **DigitalOcean Spaces** | `https://<region>.digitaloceanspaces.com` | Bucket often matches Spaces name |
| **Cloudflare R2** | `https://<accountid>.r2.cloudflarestorage.com` | S3 API; no egress fees narrative is provider-side |

The Nest app must remain **provider-agnostic**: only `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` (docs/16). Optional future vars (region, force-path-style) may be added when the SDK lands — do not invent required env names beyond docs/16 in this prep.

---

## Storage configuration (env contract)

| Variable | Required (staging/prod when File module ships) | Description |
|----------|------------------------------------------------|-------------|
| `STORAGE_ENDPOINT` | Yes | S3 API endpoint URL |
| `STORAGE_ACCESS_KEY` | Yes | Access key id |
| `STORAGE_SECRET_KEY` | Yes | Secret access key |
| `STORAGE_BUCKET` | Yes | Bucket name (e.g. `eventos-staging`, `eventos-prod`) |

Today: listed in staging templates; **not** validated by `apps/api` `env.schema` (API boots without them).

Template: [storage.example.env](./storage.example.env).

### Recommended bucket naming

| Environment | Example bucket |
|-------------|----------------|
| Local / MinIO | `eventos-dev` |
| Staging | `eventos-staging` |
| Production | `eventos-prod` |

One bucket per environment (preferred). Do not share staging and production buckets.

---

## Bucket / folder structure

Path convention (docs/10 §File Storage Strategy):

```text
{tenantId}/{module}/{entityId}/{objectName}
```

Phase 1 single-tenant (ADR-016): `tenantId` is still present in the path for forward compatibility:

```text
00000000-0000-0000-0000-000000000001/payment/<paymentId>/<objectName>
```

Module segments (recommended):

| Segment | Contents |
|---------|----------|
| `quotation` | Quotation attachments |
| `vendor` | Vendor master docs |
| `procurement` | Per-event procurement invoices/bills |
| `expense` | Expense receipts |
| `payment` | Customer payment proofs |
| `event` | Event photos / deliverables |
| `content` | Marketing / content library |
| `inventory` | Movement / item photos |
| `document` | Other tenant documents |

See [bucket-layout.example.yaml](./bucket-layout.example.yaml).

**Do not** store blobs under user-controlled raw filenames as the sole key. See naming below.

---

## Naming convention

| Rule | Spec |
|------|------|
| Object key | `{tenantId}/{module}/{entityId}/{uuid}.{ext}` |
| Display filename | Stored in Attachment metadata (`filename`), not necessarily the object key |
| Sanitization | Strip path traversal (`..`, `/`, `\`); reject empty names (docs/14) |
| Extension | Lowercase; must match whitelist |
| Uniqueness | UUID (or ULID) in object name prevents collisions on re-upload |

Example key:

```text
00000000-0000-0000-0000-000000000001/payment/a1b2c3d4-.../f9e8d7c6-....jpg
```

---

## Upload limits (docs/09 + docs/14)

| Control | Value |
|---------|--------|
| **Default max size** | **10 MB** per file |
| Override | Future tenant config (docs/09) — not implemented yet |
| **Allowed types** | PDF, JPEG, PNG, WebP, DOCX, XLSX |
| Validation | MIME check **and** extension whitelist (docs/14) |
| Rate limit (future API) | 10 uploads/minute per user (docs/14 §Rate Limiting) |
| Upload API (future) | `POST /api/v1/files/upload` multipart; returns `attachmentId` |

Business modules must **link** `attachmentId` only — no multipart inside payment/expense endpoints (docs/09).

---

## Retention

| Class | Guidance | Source |
|-------|----------|--------|
| **Financial proofs** (payments, invoices, expense receipts) | Retain **7 years** (align with financial data / audit expectations) | docs/14 PII/financial retention |
| **Attachment metadata** | Soft delete via `deleted_at`; do not hard-delete rows casually | docs/08 |
| **Blob after logical delete** | Keep until a documented purge job (future); default: retain with metadata soft-delete | docs/08 “storage deletion policy” |
| **Event / marketing photos** | Operational retention — recommend ≥ 2 years unless founders set otherwise | Not separately specified; document operator choice |
| **Provider versioning** | Enable object versioning on staging/prod buckets when available | Security recommendation |

Lifecycle rules (expire/transition to cold storage) are **operator-configured** on the provider — not defined as code in this repo (out of scope).

---

## Security recommendations

| Topic | Recommendation |
|-------|----------------|
| Encryption in transit | TLS 1.2+ to the storage endpoint (docs/14) |
| Encryption at rest | Enable provider SSE (AES-256) — docs/14 “At rest (files)” |
| Credentials | Secret manager only; never commit; never bake into images (docs/16) |
| Bucket public access | **Block all public ACLs**; private bucket only |
| Application access | Least-privilege key: `s3:PutObject`, `GetObject`, `DeleteObject` (and `ListBucket` only if required) on the env bucket prefix |
| Downloads (future) | **Signed URLs**, default **1 hour** expiry (docs/14); no permanent public object URLs |
| Path isolation | Always prefix with `tenantId` (docs/10 / docs/14) |
| Malware scanning | Phase 2 (ClamAV / cloud) — docs/14; not required for this prep |
| Logging | Never log `STORAGE_SECRET_KEY` or signed URL query secrets (R1-03 spirit) |

---

## Operator deployment checklist

1. [ ] Create a private S3-compatible bucket per environment (`eventos-staging` / `eventos-prod`)
2. [ ] Enable server-side encryption (AES-256 / provider default SSE)
3. [ ] Block public access / public ACLs
4. [ ] Create a least-privilege access key limited to that bucket
5. [ ] Store `STORAGE_ENDPOINT`, `STORAGE_ACCESS_KEY`, `STORAGE_SECRET_KEY`, `STORAGE_BUCKET` in the secret manager
6. [ ] Copy values into local operator `.env.staging` from [../staging/.env.staging.example](../staging/.env.staging.example) (never commit)
7. [ ] Confirm endpoint reaches the provider (CLI/`aws s3 ls` or equivalent) — **manual**, not automated here
8. [ ] Optional: enable versioning + lifecycle for cold storage after hot retention window
9. [ ] Leave application wiring to a later task (SDK, env.schema validation, upload round-trip)

This repository does **not** automate steps 1–4 or 7–8.

---

## Repository templates

| File | Purpose |
|------|---------|
| [storage.example.env](./storage.example.env) | Env placeholders (docs/16 names) |
| [bucket-layout.example.yaml](./bucket-layout.example.yaml) | Prefix / module layout |
| [upload-policy.example.yaml](./upload-policy.example.yaml) | Size / MIME / naming policy snapshot |

---

## Documentation drift (intentional)

| Topic | Notes |
|-------|--------|
| Backlog R2-09 AC/DoD | Full bootstrap validation + upload round-trip **not** in this prep task (user scope: docs/templates only) |
| `STORAGE_REGION` / path-style | Common SDK options; **not** in docs/16 required table — omit as required until wiring ADR/task |
| CDN | Explicitly out of scope |
