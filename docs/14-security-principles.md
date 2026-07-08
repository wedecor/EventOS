# Security Principles

## Purpose of This Document

This document defines the security requirements, practices, and standards for Event OS. Event OS handles client personal data, financial information, and business communications. Security is not optional—it is a foundational requirement from day one.

---

## Security Philosophy

### Defense in Depth

No single security control is sufficient. Event OS layers multiple controls:

```
┌─────────────────────────────────────────────────┐
│  Application Authorization (RBAC + permissions)  │
├─────────────────────────────────────────────────┤
│  Tenant Isolation (application + database RLS)   │
├─────────────────────────────────────────────────┤
│  Input Validation (Zod schemas at API boundary)  │
├─────────────────────────────────────────────────┤
│  Authentication (JWT + refresh rotation)         │
├─────────────────────────────────────────────────┤
│  Transport Security (TLS 1.2+)                   │
├─────────────────────────────────────────────────┤
│  Infrastructure Security (firewall, VPC)         │
└─────────────────────────────────────────────────┘
```

### Least Privilege

Every user, service account, and API key has the minimum permissions required for its function. Default deny.

### Secure by Default

Security controls are enabled by default, not opt-in. A new feature is not complete until its security implications are addressed.

---

## Authentication Security

### Password Requirements

| Rule | Value |
|------|-------|
| Minimum length | 12 characters |
| Complexity | At least one uppercase, lowercase, number, and special character |
| Hashing algorithm | bcrypt (cost factor 12) or Argon2id |
| Password history | Prevent reuse of last 5 passwords |
| Breach detection | Check against known breach databases (Have I Been Pwned API) |

### Session Management

| Control | Implementation |
|---------|---------------|
| Access token expiry | 15 minutes |
| Refresh token expiry | 7 days |
| Refresh token storage | HTTP-only, Secure, SameSite=Strict cookie |
| Refresh token rotation | New refresh token issued on each refresh; old token invalidated |
| Concurrent sessions | Allowed (multiple devices); each refresh token tracked independently |
| Force logout | Invalidate all refresh tokens for a user |
| Idle timeout | Configurable per tenant (default: 8 hours) |

### Brute Force Protection

| Control | Value |
|---------|-------|
| Login attempt limit | 5 failed attempts per email per 15 minutes |
| Lockout duration | 15 minutes (progressive: 15m → 30m → 1h) |
| CAPTCHA | After 3 failed attempts |
| Notification | Email user on successful login from new device/IP |

### Multi-Factor Authentication (Phase 2)

- TOTP (Google Authenticator, Authy) support
- Required for `owner` and `admin` roles
- Optional for other roles; tenant-configurable enforcement

---

## Authorization Security

### Permission Model

```
User → Role(s) → Permission(s) → Resource:Action
```

- Permissions are granular: `leads:read`, `leads:write`, `leads:assign`, `leads:delete`
- Authorization checked in **application layer**, not only at API controller
- Every application service method validates permissions from TenantContext
- Permission checks are unit tested

### Tenant Isolation

| Layer | Control |
|-------|---------|
| **Application** | TenantContext injected on every request; all queries scoped by `tenant_id` |
| **Repository** | Base repository enforces `tenant_id` filter on all operations |
| **Database (Phase 2)** | PostgreSQL Row-Level Security policies |
| **API** | `tenant_id` never accepted from request body; always from auth context |
| **Testing** | Cross-tenant access integration tests mandatory per module |

### Data Access Rules

- Users see only data within their tenant
- Role-based filtering: `sales` role sees own leads by default; `sales_manager` sees team leads
- Financial data restricted to `finance`, `owner`, `admin` roles
- Audit logs restricted to `admin`, `owner` roles
- AI context assembly respects user permissions (AI cannot access data the user cannot see)

---

## Data Security

### Encryption

| Data State | Method |
|------------|--------|
| **In transit** | TLS 1.2+ for all connections (API, database, Redis, external services) |
| **At rest (database)** | Managed database encryption (AES-256) |
| **At rest (files)** | Object storage server-side encryption (AES-256) |
| **At rest (secrets)** | Environment variables via secret manager; never in source code |
| **Sensitive fields** | Integration credentials (WhatsApp API keys, Instagram tokens) encrypted at application level before storage |

### Sensitive Data Classification

| Classification | Examples | Handling |
|----------------|----------|----------|
| **Public** | Marketing content, public website pages | No restrictions |
| **Internal** | Staff names, event types, task lists | Auth required, tenant-scoped |
| **Confidential** | Client PII, financial data, quotations | Auth + role required, audit logged |
| **Restricted** | Passwords, API keys, payment details | Encrypted, access logged, never in logs |

### Personal Data (PII)

Event OS processes personal data subject to privacy regulations:

| Data | Purpose | Retention |
|------|---------|-----------|
| Client names, emails, phones | Service delivery, communication | Duration of tenant relationship + 90 days |
| Staff personal information | Employment, assignment | Duration of employment + 1 year |
| Communication content (emails, WhatsApp) | Business operations | 2 years |
| Financial data | Billing, accounting | 7 years (legal requirement) |
| AI conversation history | Feature functionality | 1 year |

### Data Subject Rights (GDPR-Ready)

| Right | Implementation |
|-------|---------------|
| **Access** | Export all data for a client (API endpoint) |
| **Rectification** | Edit client/contact information |
| **Erasure** | Delete client and associated data (with financial record retention exceptions) |
| **Portability** | JSON/CSV export of client data |
| **Restriction** | Mark client as inactive/blocked |

---

## Input Validation and Output Encoding

### API Input Validation

- All request bodies validated with Zod schemas at API boundary
- String fields have maximum length limits
- File uploads validated: type (MIME), size (max 10MB default), extension whitelist
- SQL injection prevented by ORM parameterized queries (never string concatenation)
- NoSQL injection not applicable (PostgreSQL only)

### Output Encoding

- React's default JSX escaping prevents XSS
- Content Security Policy (CSP) headers on all responses
- API responses are `Content-Type: application/json` (no HTML rendering)
- PDF generation uses sanitized input only
- User-generated content in CMS sanitized before public rendering (DOMPurify or equivalent)

### Content Security Policy

```
default-src 'self';
script-src 'self';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self' https://api.eventos.app;
frame-ancestors 'none';
```

---

## API Security

### Rate Limiting

| Endpoint Category | Limit |
|-------------------|-------|
| Authentication (login, reset) | 10 requests/minute per IP |
| API (authenticated) | 100 requests/minute per user |
| API (authenticated, write) | 30 requests/minute per user |
| File upload | 10 requests/minute per user |
| AI endpoints | 20 requests/minute per user |
| Public endpoints (CMS, client portal) | 60 requests/minute per IP |

### API Security Headers

```
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 0 (disabled; CSP is preferred)
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

### CORS

- Allowed origins: configured per environment (tenant domains in production)
- Credentials: allowed for authenticated endpoints
- Methods: GET, POST, PUT, PATCH, DELETE
- No wildcard origins in production

---

## Infrastructure Security

### Network

- Database and Redis not publicly accessible
- Application server in private network; only load balancer exposed
- SSH access via key-based authentication only; no password login
- Firewall: allow only HTTPS (443) inbound; restrict outbound to known services

### Secrets Management

| Secret | Storage |
|--------|---------|
| Database credentials | Environment variable / secret manager |
| JWT signing keys | Environment variable / secret manager |
| AI provider API keys | Environment variable / secret manager |
| WhatsApp/Instagram API credentials | Encrypted in database (tenant-scoped) |
| Email service API keys | Environment variable / secret manager |
| Object storage credentials | Environment variable / secret manager |

**Rules:**
- Never commit secrets to version control
- `.env.example` contains placeholder values only
- Secrets rotated on schedule (JWT keys: 90 days; database: managed by provider)
- Secret access logged

### Dependency Security

- Automated dependency vulnerability scanning (Dependabot or Snyk)
- Critical vulnerabilities patched within 48 hours
- High vulnerabilities patched within 1 week
- Lock file committed (`pnpm-lock.yaml`)
- No dependencies with known critical CVEs in production

---

## Audit Logging

### What Is Logged

| Action | Data Logged |
|--------|-------------|
| Login/logout | User ID, IP, user agent, success/failure |
| Permission denied | User ID, resource, action attempted |
| Client data access | User ID, client ID, action |
| Quotation sent/approved | User ID, quotation ID |
| Booking created/cancelled | User ID, booking ID |
| Invoice created/voided | User ID, invoice ID |
| Payment recorded | User ID, invoice ID, amount |
| Settings changed | User ID, setting key, old/new value |
| User role changed | Admin user ID, target user ID, old/new role |
| Data export | User ID, export type, record count |
| AI suggestion accepted/rejected | User ID, feature, suggestion ID |

### Audit Log Properties

- **Immutable** — Audit records are append-only; never updated or deleted
- **Tamper-evident** — Stored in dedicated table with restricted write access
- **Retention** — 7 years for financial audit logs; 2 years for operational audit logs
- **Queryable** — Admin interface for audit log search (Phase 2)

---

## File Upload Security

| Control | Implementation |
|---------|---------------|
| Size limit | 10MB default (configurable per tenant) |
| Type validation | MIME type check + extension whitelist |
| Allowed types | PDF, JPEG, PNG, WebP, DOCX, XLSX |
| Storage | Object storage with tenant-scoped paths |
| Access | Signed URLs with expiry (1 hour default) |
| Malware scanning | ClamAV or cloud scanning service (Phase 2) |
| Filename sanitization | Strip path traversal characters; generate safe storage names |

---

## AI Security

| Concern | Mitigation |
|---------|------------|
| **Prompt injection** | User input sanitized before inclusion in prompts; system prompts isolated |
| **Data leakage** | AI context scoped to user's permissions and tenant |
| **Cross-tenant leakage** | Tenant ID enforced in all AI context assembly |
| **PII in prompts** | Minimize PII sent to AI providers; use IDs over full records |
| **Output validation** | All AI outputs validated against schemas before presentation |
| **Cost abuse** | Per-user and per-tenant rate limits on AI endpoints |
| **Model security** | Use reputable providers; no fine-tuning on customer data without consent |

---

## Incident Response

### Severity Levels

| Level | Description | Response Time |
|-------|-------------|---------------|
| **Critical** | Data breach, system compromise, data loss | Immediate (< 1 hour) |
| **High** | Authentication bypass, privilege escalation | < 4 hours |
| **Medium** | Vulnerability discovered, suspicious activity | < 24 hours |
| **Low** | Policy violation, minor misconfiguration | < 1 week |

### Response Process

1. **Detect** — Monitoring alerts, user report, security scan
2. **Contain** — Isolate affected systems, revoke compromised credentials
3. **Investigate** — Determine scope, root cause, data affected
4. **Remediate** — Fix vulnerability, restore from backup if needed
5. **Communicate** — Notify affected tenants per legal requirements
6. **Post-mortem** — Blameless review, update docs and controls

---

## Security Testing

| Test Type | Frequency | Scope |
|-----------|-----------|-------|
| Unit tests (auth, permissions) | Every PR | Application layer |
| Integration tests (tenant isolation) | Every PR | Cross-tenant access |
| Dependency scanning | Daily (automated) | All dependencies |
| Static analysis (SAST) | Every PR | Code vulnerabilities |
| Penetration testing | Annually (Phase 3+) | Full application |
| Security review | Per ADR for security-sensitive features | Design phase |

---

## Compliance Roadmap

| Regulation | Relevance | Phase |
|------------|-----------|-------|
| **GDPR** | EU client data | Phase 3 (data export, deletion, consent) |
| **India DPDP Act** | Indian client data | Phase 3 (primary market) |
| **PCI DSS** | Payment card data | Phase 3 (if storing card data; prefer gateway tokenization) |
| **SOC 2 Type II** | Enterprise customers | Phase 6 (multi-tenant SaaS) |

---

## Security Checklist for New Features

Every new feature must address:

- [ ] Authentication required for all endpoints
- [ ] Authorization checked in application service
- [ ] Tenant scoping enforced on all data access
- [ ] Input validated with Zod schemas
- [ ] No secrets in code or logs
- [ ] Audit logging for sensitive operations
- [ ] Error messages do not leak internal details
- [ ] File uploads validated (if applicable)
- [ ] Rate limiting applied (if applicable)
- [ ] Cross-tenant access integration test written

---

## Related Documents

| Document | Topic |
|----------|-------|
| [05-system-architecture.md](./05-system-architecture.md) | Auth and tenancy architecture |
| [08-coding-standards.md](./08-coding-standards.md) | Security coding rules |
| [09-ai-development-guide.md](./09-ai-development-guide.md) | AI security |
| [15-testing-strategy.md](./15-testing-strategy.md) | Security testing |
| [20-definition-of-done.md](./20-definition-of-done.md) | Security in DoD |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
