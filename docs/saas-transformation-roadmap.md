# Event OS — SaaS Transformation Roadmap

**Created:** 2026-09-11  
**Purpose:** Transform Event OS from a single-tenant We Decor tool into a sellable multi-tenant SaaS platform for the Indian event management industry.  
**Approach:** Prioritized phases — each phase produces a shippable increment. Execute in order.

---

## Current State Assessment

### What exists and works

| Layer | Status | Detail |
|-------|--------|--------|
| **Backend API** | ✅ Solid | NestJS modular monolith, 54 Prisma models, 40+ application services, strict layered architecture |
| **Auth** | ✅ Real | JWT + refresh tokens (HTTP-only cookie), 9 RBAC roles, 60+ permissions, login throttling, password policies, HIBP breach check |
| **Frontend** | ✅ Scaffolded | Next.js 15 + React 19, 330+ files, 21 feature modules, 55 page routes, TanStack Query/Table, Zustand, shadcn/ui |
| **Frontend auth** | ✅ Working | Login form, auth bootstrap, silent refresh, bearer injection, RBAC guards (RequirePermission, Can) |
| **CI/CD** | ✅ Basic | GitHub Actions (lint, test, build, migration, Docker build), PR checks |
| **Docker** | ✅ Local | docker-compose with Postgres 16, Redis 7, API container |
| **Testing** | ✅ Unit | Jest unit tests across services, spec files for auth/booking/workspace/execution/inventory |
| **Domain model** | ✅ Complete for Phase 1 | Full lead-to-completion lifecycle: leads, customers, quotations, bookings, workspace, tasks, checklists, staff, vendors, inventory, finance, communications, analytics, calendar |

### What's missing (the gaps that kill sellability)

| # | Gap | Impact | Effort |
|---|-----|--------|--------|
| 1 | **No cloud deployment** — only local Docker, no Dockerfile for web, no hosting | Can't demo, can't sell | Medium |
| 2 | **No file uploads** — no S3/storage integration for photos, proofs, documents | Core feature broken | Medium |
| 3 | **No PDF generation** — invoices, quotations, packing lists can't be printed/emailed | Finance module incomplete | Medium |
| 4 | **No email/SMS delivery** — communication module records exist but nothing sends | Notifications don't work | Medium |
| 5 | **No WhatsApp integration** — critical channel for Indian event management | Missing table-stakes channel | Large |
| 6 | **No payment gateway** — no Razorpay/Stripe for customer payment collection | Can't process payments | Medium |
| 7 | **No real-time notifications** — no WebSocket/SSE for in-app alerts | UX feels dead | Medium |
| 8 | **Single-tenant hardcoded** — ADR-016 single tenant, no signup, no tenant provisioning | Can't onboard new companies | Large |
| 9 | **No subscription billing** — no plan management, no metering, no SaaS revenue model | Can't charge customers | Large |
| 10 | **No mobile optimization** — sidebar hidden on mobile (`hidden md:flex`), no PWA | 70%+ Indian users on mobile | Medium |
| 11 | **No seed/demo data** — no way to demo the product to prospects | Can't sell | Small |
| 12 | **No onboarding flow** — no guided setup for new tenants | High churn risk | Medium |
| 13 | **No monitoring/APM** — Sentry DSN optional, no dashboards, no alerting | Blind in production | Small |
| 14 | **No rate limiting** — Redis exists but no API rate limiting middleware | Security gap | Small |
| 15 | **No data export** — no CSV/Excel export from any list | Users trapped | Small |

---

## Execution Phases

### Phase 0: Production-Ready Foundation (Weeks 1–3)

**Goal:** Get the existing app deployed and demoable. Zero new features — just make what exists actually run in the cloud.

#### 0.1 — Cloud Deployment

| Task | Detail |
|------|--------|
| API Dockerfile optimization | Multi-stage build already exists — verify, add health check |
| Web Dockerfile | Create multi-stage Next.js static build → Nginx container |
| Docker Compose production | Separate prod compose with managed Postgres/Redis URLs |
| Cloud provider setup | Railway / Render / AWS ECS — pick one, deploy API + Web + Postgres + Redis |
| Domain + SSL | Custom domain, SSL cert, CORS locked down |
| Environment variables | Prod-grade JWT_SECRET, DATABASE_URL, REDIS connection |
| Database migrations | `prisma migrate deploy` in CI/CD pipeline |

#### 0.2 — Monitoring & Security Hardening

| Task | Detail |
|------|--------|
| Sentry integration | Wire up SENTRY_DSN for both API and Web |
| Structured logging | Pino already configured — ensure JSON logs ship to log aggregator |
| Rate limiting | NestJS throttler module on auth endpoints + API-wide limits |
| CORS lockdown | CORS_ORIGIN = production domain only |
| Helmet headers | Security headers middleware |
| Health check endpoint | `/health` already exists — add `/ready` with DB ping |

#### 0.3 — Seed Data & Demo Mode

| Task | Detail |
|------|--------|
| Seed script | `prisma db seed` — demo tenant, users (admin/coordinator/viewer), sample leads → quotations → bookings → events with full lifecycle |
| Demo credentials | Documented test accounts for each role |
| Reset script | One-command demo data reset |

**Deliverable:** Live URL you can log into and demo the full lead-to-completion workflow.

---

### Phase 1: Core Integrations (Weeks 4–7)

**Goal:** Make the existing features actually work end-to-end by connecting the integration points.

#### 1.1 — File Upload Service

| Task | Detail |
|------|--------|
| S3-compatible storage | AWS S3 or Cloudflare R2 (cheaper) |
| `FileService` abstraction | Upload, signed URL generation, delete |
| `FileController` | `POST /files/upload` (multipart), `GET /files/:id/url` |
| Prisma `File` model | id, tenantId, key, bucket, mimeType, sizeBytes, uploadedBy |
| Wire into modules | Payment proofs, inventory photos, damage reports, financial documents |
| Frontend `FileUpload` component | Drag-and-drop, progress bar, preview |

#### 1.2 — PDF Generation

| Task | Detail |
|------|--------|
| PDF service | Puppeteer or `@react-pdf/renderer` for server-side generation |
| Invoice PDF template | Company header, line items, totals, GST breakdown, payment terms |
| Quotation PDF template | Similar layout with quote-specific fields |
| Packing list PDF | Inventory items grouped by movement status |
| Download + email attachment support | Signed S3 URL for generated PDFs |

#### 1.3 — Email Delivery

| Task | Detail |
|------|--------|
| Email service abstraction | `EmailService` with provider interface |
| Provider: AWS SES or Resend | Transactional email delivery |
| Email templates | Invoice sent, payment confirmation, booking confirmation, reminder |
| Queue integration | BullMQ (Redis) for async email delivery with retries |
| Frontend notification preferences | Wire existing `NotificationPreference` module to actual delivery |

#### 1.4 — SMS Delivery (Indian carriers)

| Task | Detail |
|------|--------|
| SMS service abstraction | `SmsService` with provider interface |
| Provider: MSG91 or Twilio | Indian SMS gateway with DLT template registration |
| Templates | Payment reminder, booking confirmation, event day alert |
| BullMQ queue | Same queue infrastructure as email |

**Deliverable:** Full working loop — create invoice → generate PDF → email to customer with PDF attachment → customer sees it.

---

### Phase 2: Real-Time & Mobile (Weeks 8–10)

**Goal:** Make the app feel alive and work on phones.

#### 2.1 — Real-Time Notifications

| Task | Detail |
|------|--------|
| WebSocket gateway | NestJS `@WebSocketGateway` with JWT auth |
| Notification service | Persist notifications to DB + broadcast via WebSocket |
| Domain event → notification | Wire key domain events (booking status change, payment received, task assigned) to notification creation |
| Frontend notification bell | Real-time badge count, dropdown with notification list, mark-as-read |
| Toast notifications | Sonner toasts on incoming real-time events |

#### 2.2 — Mobile Responsiveness

| Task | Detail |
|------|--------|
| Responsive sidebar | Sheet/drawer on mobile, collapsible on tablet |
| Mobile navigation | Bottom tab bar or hamburger menu |
| Touch-optimized tables | Horizontal scroll, card view on small screens |
| Form layouts | Stack fields vertically on mobile |
| Test on real devices | iPhone SE, mid-range Android (Samsung A series) |

#### 2.3 — PWA Setup

| Task | Detail |
|------|--------|
| Web manifest | `manifest.json` with app name, icons, theme color |
| Service worker | Offline shell, cache API responses |
| Install prompt | "Add to Home Screen" banner |
| Push notifications | Web Push API integration with notification service |

**Deliverable:** App works on phone, shows real-time notifications, installable as PWA.

---

### Phase 3: WhatsApp & Payment Gateway (Weeks 11–14)

**Goal:** Connect the two channels that Indian event companies can't live without.

#### 3.1 — WhatsApp Business API

| Task | Detail |
|------|--------|
| WABA provider | Twilio WhatsApp or official Meta Cloud API |
| WhatsApp service | Send template messages, receive webhooks |
| Message templates | Booking confirmation, payment reminder, event day checklist |
| Webhook handler | Incoming messages → create/update communication records |
| Two-way sync | WhatsApp messages appear in Event OS communication timeline |
| Lead capture | WhatsApp enquiry → auto-create lead |
| Frontend WhatsApp composer | Template picker, variable substitution, send from event workspace |

#### 3.2 — Payment Gateway (Razorpay)

| Task | Detail |
|------|--------|
| Razorpay integration | Payment Links API for customer-facing payment collection |
| Payment link generation | From invoice → generate Razorpay payment link → send via WhatsApp/email |
| Webhook handler | `payment.captured` → auto-record payment in Event OS |
| Partial payments | Support advance + balance payment lifecycle |
| Refund support | Initiate refund from Event OS → Razorpay |
| Frontend payment status | Real-time payment status on invoice/booking view |
| UPI/card/netbanking | All methods via Razorpay checkout |

**Deliverable:** Send invoice via WhatsApp → customer pays via Razorpay link → payment auto-recorded in Event OS.

---

### Phase 4: Multi-Tenant SaaS Conversion (Weeks 15–20)

**Goal:** Allow multiple event companies to sign up and use Event OS independently.

#### 4.1 — Tenant Provisioning

| Task | Detail |
|------|--------|
| Signup flow | Email + company name + password → create tenant + admin user |
| Email verification | Verify email before activating tenant |
| Tenant slug | `{company}.eventos.app` subdomain or `app.eventos.app/{slug}` path |
| Prisma schema changes | Add `domain`, `logo`, `plan`, `trialEndsAt` to Tenant model |
| Tenant middleware | Resolve tenant from subdomain/header, inject into request context |
| Data isolation audit | Verify every repository query includes `tenantId` (already done via `TenantScopedRepository`) |
| Tenant-scoped Redis | Namespace Redis keys by tenantId |

#### 4.2 — Subscription Billing

| Task | Detail |
|------|--------|
| Plan model | Free trial (14 days), Starter, Professional, Enterprise |
| Prisma models | `Plan`, `Subscription`, `BillingEvent` |
| Razorpay Subscriptions API | Create subscription, handle webhooks (charged, halted, cancelled) |
| Plan enforcement | Feature gates based on plan tier (e.g., staff limit, storage limit) |
| Billing portal | Current plan, upgrade/downgrade, invoice history, payment method |
| Trial expiry | Grace period → read-only mode → data export → deletion after 90 days |
| Usage metering | Events/month, storage used, staff count — show on billing page |

#### 4.3 — Tenant Onboarding

| Task | Detail |
|------|--------|
| Setup wizard | Company profile → import staff → add first inventory → create first event |
| Sample data toggle | "Populate with demo data" for self-exploration |
| Onboarding checklist | Persistent checklist in dashboard: "Complete your setup" |
| Welcome email sequence | Day 0, Day 3, Day 7, Day 13 (trial ending) |

#### 4.4 — Super Admin Panel

| Task | Detail |
|------|--------|
| Admin dashboard | Total tenants, MRR, active users, trial conversions |
| Tenant management | View/edit/suspend/delete tenants |
| Plan management | Create/edit plans, set feature limits |
| System health | API metrics, error rates, slow queries |

**Deliverable:** Event companies can sign up at `eventos.app`, start a free trial, and upgrade to a paid plan.

---

### Phase 5: Growth & Polish (Weeks 21–24)

**Goal:** Features that make customers stay and recommend the product.

#### 5.1 — Data Export & Reports

| Task | Detail |
|------|--------|
| CSV/Excel export | Export any list view (leads, bookings, invoices, inventory) |
| Report builder | Predefined reports: monthly revenue, event profitability, lead conversion funnel |
| Scheduled reports | Email weekly/monthly report PDF to founders |
| GST report | GST-compliant output for Indian tax filing |

#### 5.2 — Client Portal (Customer-Facing)

| Task | Detail |
|------|--------|
| Separate portal app | `portal.eventos.app` — customers log in to see their events |
| View event status | Timeline, upcoming milestones, photos |
| View & approve quotations | Accept/reject quote, add comments |
| Make payments | Pay invoices directly via Razorpay |
| Communication history | See all messages exchanged |

#### 5.3 — Advanced Features

| Task | Detail |
|------|--------|
| Event templates | Clone past events as templates for recurring event types |
| Bulk operations | Bulk status update, bulk assignment, bulk movement |
| Custom fields | Per-tenant custom fields on leads, events, inventory |
| Audit log viewer | UI for the existing audit log data |
| API rate limiting per tenant | Per-plan rate limits |
| Webhook system | Tenant-configurable webhooks for integrations |

**Deliverable:** Fully polished SaaS product with customer-facing portal and self-service reporting.

---

## Technology Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| **Cloud hosting** | Railway or AWS ECS | Railway for speed-to-market, ECS for scale |
| **File storage** | Cloudflare R2 | S3-compatible, no egress fees, cheap |
| **Email** | Resend or AWS SES | Resend for DX, SES for cost at scale |
| **SMS** | MSG91 | Indian carrier coverage, DLT compliance built-in |
| **WhatsApp** | Meta Cloud API (via official BSP) | Direct API, no middleware markup |
| **Payment gateway** | Razorpay | Indian market leader, UPI/cards/netbanking, Subscriptions API |
| **PDF generation** | Puppeteer (headless Chrome) | Pixel-perfect HTML→PDF, reuse React templates |
| **Real-time** | NestJS WebSocket Gateway | Already in the framework, JWT auth built-in |
| **PWA** | next-pwa | Minimal config for static export |
| **Monitoring** | Sentry + Axiom/Betterstack | Error tracking + log aggregation |
| **Queue** | BullMQ (Redis) | Already have Redis, battle-tested job queue |
| **Subdomain routing** | Wildcard DNS + tenant middleware | Clean isolation without path-prefix confusion |

---

## Pricing Model (Recommended)

| Plan | Price (INR/mo) | Limits |
|------|---------------|--------|
| **Free Trial** | ₹0 (14 days) | Full features, 5 events, 2 staff |
| **Starter** | ₹2,999 | 20 events/mo, 5 staff, 1 GB storage, email/SMS |
| **Professional** | ₹7,999 | 100 events/mo, 25 staff, 10 GB storage, WhatsApp, priority support |
| **Enterprise** | Custom | Unlimited, custom integrations, dedicated support, SLA |

---

## Execution Priority Summary

```
Phase 0 (Weeks 1–3)     Deploy + Monitor + Demo Data
      │
Phase 1 (Weeks 4–7)     File Upload + PDF + Email + SMS
      │
Phase 2 (Weeks 8–10)    Real-Time + Mobile + PWA
      │
Phase 3 (Weeks 11–14)   WhatsApp + Razorpay
      │
Phase 4 (Weeks 15–20)   Multi-Tenant + Billing + Onboarding + Admin
      │
Phase 5 (Weeks 21–24)   Export + Client Portal + Advanced Features
```

**Total estimated timeline:** ~24 weeks (6 months) to fully sellable SaaS.

**First demoable product:** End of Phase 0 (3 weeks).  
**First paying customer possible:** End of Phase 4 (20 weeks).  
**Feature-complete SaaS:** End of Phase 5 (24 weeks).

---

## What to Build First (Immediate Next Steps)

1. **Phase 0.1** — Deploy to Railway/Render with managed Postgres + Redis
2. **Phase 0.3** — Seed data so the deployed app has content to demo
3. **Phase 0.2** — Sentry + rate limiting + security headers
4. **Phase 1.1** — File uploads (unblocks payment proofs, inventory photos)
5. **Phase 1.2** — PDF generation (unblocks invoice/quotation delivery)

These five items turn Event OS from "source code on GitHub" into "working product with a URL."

---

*This roadmap supersedes the SaaS portions of `docs/11-roadmap.md` and should be read alongside it. Phase 1 business scope (Doc 19) remains the authority for We Decor feature completeness; this document covers the infrastructure and platform work needed to sell Event OS to other companies.*
