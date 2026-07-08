# We Decor Events — Technology & Systems Landscape

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Version** | 0.1 |
| **Created Date** | 2026-07-08 |
| **Last Updated** | 2026-07-08 |
| **Next Review Date** | Not Defined |
| **Document Purpose** | Document We Decor's **current technology and systems landscape**—applications, channels, data stores, integrations, and gaps—as the baseline for Event OS adoption and migration. This bridges operational Business Bible docs (`04`–`13`) to product requirements (`19`) and SaaS evolution (`20`). |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-08 | Ilyas + Zakir (Interview in progress) | Initial document created. Purpose and scope defined. Current-state systems inventory pending interview. |
| 0.1 | 2026-07-08 | Ilyas (Interview Q1) | Captured complete applications and digital tools inventory (9 active systems); confirmed no inventory/accounting/ERP/centralized ops platform. |
| 0.1 | 2026-07-08 | Ilyas (Interview Q2) | Captured data storage mapping: per-app records, duplicated fields, and operational data living outside both apps. |
| 0.1 | 2026-07-08 | Ilyas (Interview Q3) | Captured end-to-end workflow (enquiry → completion); manual re-entry between apps; operational data outside applications. |
| 0.1 | 2026-07-08 | Code audit | Added **Existing System Capability Audit** from repository inspection (`current-systems/`). |
| 0.1 | 2026-07-08 | Code audit | Expanded **Reference Systems Capability Audit** (`crm-system/`, `inventory-system/`). |
| 0.1 | 2026-07-08 | Code audit | Added **§6.3 Django CRM Capability Audit** (`autoparts-erp-django/`) — verified as autoparts ERP Django port, not CRM. |

---

## Purpose of This Document

### Why Document 18 exists

Documents `01`–`17` describe **how the business operates**. Document `19` will consolidate **what Event OS Phase 1 must deliver**. This document captures **what systems exist today** and **how data flows (or does not flow)** between them.

It answers:

- What applications and tools does We Decor use today?
- Who owns each system?
- What data lives where?
- What is integrated vs disconnected?
- What must Event OS replace, absorb, or integrate with?

### Boundary with other documents

| Document | Scope |
|----------|-------|
| `02-business-model.md` | High-level tool mentions (Lead Management Application, Quotation and Billing Application) |
| **`18-technology-systems-landscape.md` (this doc)** | **Detailed current-state systems map, ownership, data flows, integration gaps** |
| `19-event-os-phase1-requirements.md` | Consolidated Phase 1 business requirements for Event OS |
| `/docs/11-roadmap.md` | Engineering delivery timeline and sprints |
| `20-saas-evolution-plan.md` | Multi-tenant product evolution beyond We Decor |

**This document does not define Event OS features** (see `19`) **or engineering architecture** (see `/docs/05-system-architecture.md`).

---

## Document Scope: Policy vs Execution

| Layer | Source | Status in This Document |
|-------|--------|-------------------------|
| **Founder business policy** | Ilyas interview | Documented where captured; gaps flagged **Not Defined** |
| **Tactical execution** | Zakir day-to-day practice | Documented where captured; gaps flagged **Not Yet Interviewed (Zakir)** |
| **Verified technical capabilities** | Repository code audit (`current-systems/`) | Documented in [Existing System Capability Audit](#existing-system-capability-audit) |
| **Future vision** | Founder + Zakir preferences | Labelled **Future Vision** |

---

## 1. Executive Summary

### Current State

We Decor operates on **9 active applications/platforms** plus informal payment records. Two **custom internal applications** (Lead Management, Quotation and Billing) anchor sales workflow. **No** dedicated inventory management system, accounting software, ERP, or centralized operations platform exists today.

*Data storage (Q2) and end-to-end workflow (Q3) captured. Deeper payment/status linkage: pending interview (Q4+).*

### Founder Policy

**Not Defined.**

### Future Vision

Event OS becomes the **primary operational system of record**, replacing or integrating disconnected applications with a unified event lifecycle record.

---

## 2. Systems Inventory (Current State)

*Captured from founder interview (Q1, 2026-07-08).*

### Active Applications & Digital Tools

| # | System | Type | Primary uses | Users |
|---|--------|------|--------------|-------|
| 1 | **Lead Management Application** | Custom internal application | Enquiry/lead management; customer details; lead status tracking; lead assignment; lead source tagging; change notifications; WhatsApp Google review requests | Ilyas, Zakir | `current-systems/lead-management-app/` |
| 2 | **Quotation and Billing Application** | Custom internal application | Quotation creation; pricing details; billing-related activities | Ilyas, Zakir (operational/customer-related usage where required) | `current-systems/quotation-billing-app/` |
| 3 | **Website** (We Decor) | Custom website | Service/portfolio showcase; enquiry intake; online presence and SEO | Customers (public); Ilyas (management, content, technical updates) | `current-systems/wedecor-website/` |
| 4 | **WhatsApp** | Communication platform | Customer, vendor, and internal communication; payment proofs, bills, updates | Ilyas, Zakir, staff/decorators, vendors, customers |
| 5 | **Instagram** | Social media platform | Marketing; lead generation; decor content; customer enquiries via DMs | Ilyas |
| 6 | **Facebook** | Social media platform | Online presence; content sharing | Ilyas |
| 7 | **Google Drive** | Cloud storage | Event photos/videos; business files and media | Ilyas, Zakir (when required) |
| 8 | **UPI payment apps / bank payment records** | Payment platforms | Customer payments; vendor payments; payment verification | Ilyas, Zakir |
| 9 | **Google Business Profile** | Business listing platform | Google reviews; online presence | Ilyas |

### Systems Not in Active Use (Confirmed Absence)

| Category | Status |
|----------|--------|
| Inventory management system | **Not in use** |
| Accounting software | **Not in use** |
| ERP | **Not in use** |
| Centralized operations platform | **Not in use** |

### Planned / Future (Not Daily Ops Today)

| System | Status |
|--------|--------|
| Event OS | Planned replacement / unified platform — **not live** for We Decor daily operations |

### Communication Channels (Non-Application)

| Channel | Role | Documented in |
|---------|------|---------------|
| Phone | Customer support, coordination | `12-customer-support.md` |

*Instagram Ads / Meta Ads Manager: not listed in Q1 inventory — confirm in follow-up if separate from Instagram app usage (`10-marketing-workflow.md`).*

### Informal Data Stores

| Store | Purpose | Users |
|-------|---------|-------|
| UPI screenshots / bank records | Payment proof (customer and vendor) | Ilyas, Zakir |
| Founder/team memory | Vendor lists, staffing, planning, packing | Zakir, team (`07`, `08`, `16`) |
| Paper bills | Vendor/customer payment proof | Zakir (`07`, `09`) |

Structured spreadsheet/database for operations: **Not Currently Implemented**.

---

## 2.1 Data Storage by System (Current State)

*Captured from founder interview (Q2, 2026-07-08).*

### Lead Management Application — Stored Data

| Data type | Examples / notes |
|-----------|------------------|
| Customer identity | Name, phone number, location |
| Event context | Event type, event date |
| Sales pipeline | Lead source (Instagram Ads, organic Instagram, website, WhatsApp, referral, etc.); lead status; lead assignment |
| Follow-up | Follow-up details |
| Communication | Customer communication-related information |

### Quotation and Billing Application — Stored Data

| Data type | Examples / notes |
|-----------|------------------|
| Quotation | Customer quotation details; quotation line items; pricing details; package/service details |
| Billing | Billing information; payment-related billing records |

### Data Stored in Both Applications (Duplicated)

| Data type | Notes |
|-----------|-------|
| Customer name | Entered/maintained in both systems |
| Customer contact details | Where required for quotation/billing reference |
| Event details | Details required for quotation and billing |

### Data Not Stored in Either Application

*Operational and financial execution data lives outside both custom apps today.*

| Data type | Currently managed via |
|-----------|----------------------|
| Vendor expenses | WhatsApp, paper bills, memory |
| Event-wise procurement costs | WhatsApp, memory |
| Inventory usage | Memory/experience |
| Staff allocation details | WhatsApp, memory |
| Packing lists | Memory/experience |
| Vendor payment proofs | WhatsApp, UPI/payment records, paper bills |
| Customer payment proofs | WhatsApp, UPI/payment records |
| Event profitability calculations | **Not calculated** (no system) |
| Event photos/videos | Google Drive |
| Vendor bills/invoices | WhatsApp, paper bills |

---

## 3. Data Flow & Integration Map

### Current State — End-to-End Workflow

*Captured from founder interview (Q3, 2026-07-08).*

| Step | Stage | Primary system(s) | Owner | What happens |
|------|-------|-------------------|-------|--------------|
| 1 | **Enquiry received** | Lead Management Application | Ilyas | Lead captured; lead source tagged (Instagram Ads, organic Instagram, website, WhatsApp, referrals) |
| 2 | **Qualification / In Talks** | Lead Management Application + WhatsApp | Ilyas → Zakir (after assignment) | Requirements, discussions, follow-ups via WhatsApp; pipeline tracked in Lead Management Application; **some conversation detail remains WhatsApp-only** |
| 3 | **Quotation creation** | Quotation and Billing Application | Ilyas / Zakir | Customer and event details **manually copied/re-entered** from Lead Management Application; quotation, pricing, and line items created in Quotation and Billing Application |
| 4 | **Approval + advance payment** | Quotation and Billing Application + Lead Management Application + WhatsApp/UPI | Zakir | Approval via customer interactions; advance verified manually (UPI screenshot or cash); **payment details not centrally linked** across systems |
| 5 | **Event preparation + execution** | WhatsApp, Google Drive, memory, paper bills, UPI records | Zakir + team | Staff, vendors, procurement, packing, inventory, execution — **all outside existing applications**; no centralized event operations workspace |
| 6 | **Event completion** | Lead Management Application + WhatsApp + Google Drive | Zakir | Completion managed operationally; status tracked in Lead Management Application; review request via Lead Management Application WhatsApp feature; photos/videos in Google Drive |

### Workflow Diagram (Current State)

```
Enquiry (IG Ads / IG / Web / WA / Referral)
    → [Ilyas] Lead Management Application (capture + source tag)
    → [Ilyas → Zakir] In Talks (Lead Mgmt App + WhatsApp)
    → [Ilyas/Zakir] MANUAL RE-ENTRY → Quotation & Billing Application
    → [Zakir] Approval + advance (WA + UPI/cash; not linked across apps)
    → [Zakir + team] Execution (WhatsApp / Drive / memory / bills only)
    → [Zakir] Completed (Lead Mgmt App status + WA review + Drive media)
```

### Manual Duplication & Gaps (Confirmed)

| Gap | Detail |
|-----|--------|
| **Cross-app re-entry** | Customer and event details manually copied from Lead Management Application → Quotation and Billing Application |
| **Payment disconnect** | Payment information not connected between systems; manual UPI/cash verification |
| **Ops data outside apps** | Staff, vendors, inventory, procurement exist only in WhatsApp, memory, paper, UPI |
| **No ops workspace** | No centralized event operations workspace at or after approval |
| **Profitability blind spot** | Revenue (billing app) and costs (informal) stored separately — **cannot auto-calculate event profitability** |
| **WhatsApp-only history** | Detailed customer conversations not fully captured in Lead Management Application |

### Known Integration Gaps (Summary)

| Gap | Impact | Status |
|-----|--------|--------|
| Lead Management Application ↔ Quotation and Billing Application | Duplicate customer/event entry; no single event record | **Confirmed (Q2)** |
| Core apps ↔ operations data | Vendor, inventory, staff, packing not in any app | **Confirmed (Q2)** |
| Core apps ↔ payment proofs | Customer/vendor proofs in WhatsApp/UPI/paper only | **Confirmed (Q2)** |
| Core apps ↔ media | Event photos/videos in Google Drive only | **Confirmed (Q2)** |
| Approved booking → operations workspace | No automated ops plan linkage | `05` |
| WhatsApp ↔ CRM | Customer history not structured | `03`, `04` |
| Event profitability | Not calculable from current systems | **Confirmed (Q2)** |

### Future Vision

Unified event record in Event OS: lead → quote → approved → operations → completed → finance → content library.

---

## Existing System Capability Audit

*Source: repository code inspection (2026-07-08). Paths under `EventOS/current-systems/`.*

**Evidence layers in this document:**

| Layer | Sections | Basis |
|-------|----------|-------|
| **Interview Current State** | §2, §2.1, §3 | Founder interview (Ilyas) |
| **Verified technical capabilities** | This section | Application source code and config |
| **Future vision** | §9 | Founder direction + Event OS planning |

**Legend:** ✅ Already implemented · 🟡 Partially implemented · 🔴 Manual process / missing in code · 🔵 Future Event OS requirement

---

### Audit summary (cross-system)

| Capability area | Lead Mgmt App | Quotation/Billing App | Website | Notes |
|-----------------|---------------|----------------------|---------|-------|
| Lead/enquiry capture | ✅ | 🔴 | 🟡 | Website captures via API but **does not persist** leads server-side |
| Pipeline / status tracking | ✅ | 🔴 | 🔴 | Kanban, dashboard, auto-expire CF |
| Lead source tracking | ✅ | 🔴 | 🟡 | Website sets `source: contact_form` only on API path |
| Customer master record | 🟡 | 🟡 | 🔴 | Embedded per enquiry (Firestore) or per bill (Hive); no shared customer ID |
| Quotation + line items | 🔴 | ✅ | 🔴 | Billing app only; offline Hive |
| Invoice / billing PDF | 🔴 | ✅ | 🔴 | GST PDF, audit hash, amendments |
| Payment tracking / proofs | 🟡 | 🔴 | 🔴 | `advancePaid` + `paymentStatus` fields on enquiry only; no proof storage |
| Cross-app integration | 🔴 | 🔴 | 🔵 | No shared API, webhook to Lead app, or sync code |
| Operations (staff/vendor/inventory) | 🔴 | 🔴 | 🔴 | All outside apps per interview |
| Notifications (push) | ✅ | 🔴 | 🔴 | FCM + in-app inbox on lead app |
| Analytics / KPIs | 🟡 | 🟡 | 🟡 | Lead app dashboard; billing CSV export; website GA4 optional |
| Review requests | ✅ | 🔴 | 🔴 | WhatsApp deep-link from lead app |
| SEO / marketing pages | 🔴 | 🔴 | ✅ | 31 locality + service pages |

---

### 1. Lead Management Application

**Repository:** `current-systems/lead-management-app/` (`wedecor/enquiryApp`)  
**Code name:** We Decor Enquiries v2.0.11 (`we_decor_enquiries`)

#### 1.1 Application overview

| Field | Verified detail |
|-------|-----------------|
| **Stack** | Flutter 3.x (Dart ^3.8), Riverpod, Freezed; Firebase Auth, Firestore, Storage, FCM, Cloud Functions, Crashlytics |
| **Purpose** | Enquiry/lead CRM for event decoration — pipeline, assignment, basic financial fields, analytics |
| **Primary users** | `admin` and `staff` roles (Firestore `users.role`) — maps to Ilyas/Zakir operationally |
| **Deployment** | Firebase project `wedecorenquries`; Hosting `build/web`; CI deploy on `main`; Functions region `asia-south1`; optional Vercel static serve |
| **Platforms** | Android, iOS, Web, Windows |

#### 1.2 Existing features

| Category | Status | Detail |
|----------|--------|--------|
| **Screens/modules** | ✅ | Auth, Dashboard, Calendar, Enquiries (list/form/detail/kanban), Analytics (admin), User Management, Dropdown config, Settings, Notifications, Legal |
| **Pipeline workflow** | ✅ | Statuses: `new` → `in_talks` → `approved` → `completed`; lost: `not_interested`, `closed_lost`, `cancelled` |
| **Enquiry CRUD** | ✅ | Admin creates; staff edits assigned only; RBAC in `firestore.rules` |
| **Assignment + notify** | ✅ | `assignedTo`; FCM + in-app on assignment/status/payment field changes |
| **Follow-up reminders** | 🟡 | Dashboard "Follow Up" tab (in_talks + event within 21 days); notes field; scheduled overdue CF **disabled** |
| **Auto status rules** | ✅ | Cloud Function `autoExpireEnquiries` (4h): past-date approved → completed; unbooked → not_interested |
| **Data captured** | ✅ | Customer name/phone/email/location; event type/date/location/guest/budget; source, priority, status; `totalCost`, `advancePaid`, `paymentStatus`; images; audit history |
| **Reports** | ✅ | Admin analytics (KPIs, trends, breakdowns by source/status/type); CSV export (role-based columns) |
| **Integrations** | 🟡 | Phone (`tel:`), WhatsApp launch, review-request WhatsApp; **no** website webhook, billing app sync, or payment gateway |
| **Review requests** | ✅ | `ReviewRequestService` — WhatsApp with Google/Instagram/website links from `app_config` |

#### 1.3 Data ownership (verified)

| Data domain | Storage | Notes |
|-------------|---------|-------|
| Customers | `enquiries/` (embedded) | No separate `customers/` collection |
| Leads | `enquiries/` | Enquiry ≈ lead |
| Event details | `enquiries/` | No separate events collection |
| Quotations | 🔴 | Not in this app |
| Billing | 🟡 | `totalCost`, `advancePaid`, `paymentStatus` on enquiry doc only |
| Payments / proofs | 🔴 | No proof uploads; no UPI linkage |
| Follow-ups | 🟡 | `notes` + dashboard reminder logic |
| Notifications | `users/{uid}/notifications/`, FCM tokens | Cloud Functions write on enquiry changes |
| Users/staff | `users/` | admin/staff roles only |

#### 1.4 Business Bible capability classification

| Capability | Status | Evidence |
|------------|--------|----------|
| Lead capture + source tagging | ✅ | `enquiry_form_screen`, `source` dropdown, analytics by source |
| Pipeline (New → In Talks → Approved → Completed) | ✅ | `status_vocabulary.dart`, kanban, dashboard |
| Lead assignment + notifications | ✅ | `NotificationService`, `notifyOnEnquiryChange` CF |
| Follow-up tracking | 🟡 | Notes + UI reminders; no structured follow-up entity |
| Customer communication timeline | 🔴 | External WhatsApp/phone only |
| Quotation line items | 🔴 | Not in codebase |
| Payment verification / proofs | 🔴 | Manual fields only |
| Event profitability | 🔴 | No expense or margin logic |
| Founder KPI dashboard (Doc 15) | 🟡 | Enquiries, conversion, revenue estimate from `totalCost`; **no gross margin** |
| Hard block: advance before Approved | 🔴 | Not enforced in code |
| Hard block: financial review before Completed | 🔴 | Not enforced |
| Event workspace at Approved | 🔵 | Not in codebase |
| Vendor / inventory / ops | 🔵 | Not in codebase |
| Website enquiry auto-import | 🔵 | No API/webhook receiver in app |

---

### 2. Quotation and Billing Application

**Repository:** `current-systems/quotation-billing-app/` (`wedecor/KABilling`)  
**Code name:** `ka_billing_app` v1.0.0 — **branded in code as "KA Furnitures Billing"** (furniture/GST billing defaults; no "We Decor" strings in `lib/`)

#### 2.1 Application overview

| Field | Verified detail |
|-------|-----------------|
| **Stack** | Flutter (Dart ^3.9), Riverpod, Hive (local), pdf/printing, path_provider |
| **Purpose** | Offline quotation & invoice creation with GST, PDF generation, audit-safe finalization, backup/export |
| **Primary users** | Single-operator device app; optional PIN lock — **no user accounts or roles** |
| **Deployment** | Local device only; Android package `com.kafurnitures.kafurniturebilling`; **no cloud backend** |
| **Data** | Hive boxes: `bills`, `customers`, `products`, `settings`; PDFs on filesystem |

#### 2.2 Existing features

| Category | Status | Detail |
|----------|--------|--------|
| **Screens** | ✅ | Home, Create Bill, History, Quotations, Invoices, Customers, Products, Settings, PDF preview, PIN lock |
| **Quotation workflow** | ✅ | `BillType.quote` — customer snapshot, line items, GST, valid-until date, draft/finalise |
| **Invoice workflow** | ✅ | `BillType.invoice` — delivery date, vehicle number, PDF on finalise |
| **Quote → invoice conversion** | 🟡 | `BillModel.toInvoice()` exists; **no UI action** to convert |
| **Line items + pricing** | ✅ | Qty × price, HSN, CGST/SGST/IGST |
| **Customer catalog** | ✅ | Autocomplete from Hive `customers` box |
| **Product catalog** | ✅ | Name, HSN, last price — pricing reference only |
| **PDF + share/print** | ✅ | `PdfService`; SHA-256 hash on finalised PDF |
| **Amendments / cancel** | ✅ | Audit workflow with reason codes |
| **Reports** | 🟡 | Monthly CSV + GST summary + PDF ZIP export — no pipeline analytics |
| **Notifications** | 🔴 | Backup reminder banner only |
| **Integrations** | 🔴 | No Firebase, CRM, WhatsApp API, or payment gateway |

#### 2.3 Data ownership (verified)

| Data domain | Storage | Notes |
|-------------|---------|-------|
| Customers | Hive `customers` + embedded on `BillModel` | Catalog separate from bills (audit snapshot) |
| Leads | 🔴 | No lead model |
| Event details | 🟡 | Free-text addresses + `deliveryDate` only; no event type/venue entity |
| Quotations | Hive `bills` (`BillType.quote`) | Unified bill model |
| Invoices | Hive `bills` (`BillType.invoice`) | Same box |
| Billing / line items | Embedded in `BillModel.items` | |
| Payments | 🔴 | Not on active `BillModel` (legacy `Invoice.isPaid` unused) |
| Follow-ups | 🔴 | None |
| Users/staff | 🔴 | PIN only; no accounts |

**Backup gap (code):** `BackupService` exports `bills` + `settings` only — **customers and products not included**.

#### 2.4 Business Bible capability classification

| Capability | Status | Evidence |
|------------|--------|----------|
| Quotation creation + line items | ✅ | `CreateBillScreen`, `BillModel` |
| Pricing details / packages | 🟡 | Generic line items; no decor package structure |
| Billing / invoice PDFs | ✅ | `PdfService`, finalised PDF storage |
| Payment-related billing records | 🔴 | No advance/balance/paid tracking on `BillModel` |
| Link to Lead Management Application | 🔴 | No integration code; fully offline |
| Event-specific fields (type, venue) | 🔴 | Address + date only |
| We Decor branding / defaults | 🔴 | KA Furnitures defaults in `constants.dart` |
| Event profitability | 🔴 | No cost or margin fields |

---

### 3. We Decor Website

**Repository:** `current-systems/wedecor-website/` (`wedecor/we-decor-site`)  
**Domain (code):** `https://www.wedecorevents.com`

#### 3.1 Application overview

| Field | Verified detail |
|-------|-----------------|
| **Stack** | Next.js 15 App Router, React 19, Tailwind, MDX; Cloudinary images |
| **Purpose** | Marketing, SEO, portfolio, enquiry intake for Bangalore event decoration |
| **Primary users** | Public visitors; Ilyas for content/deploy |
| **Deployment** | Vercel (`vercel-deploy.sh`); CI via GitHub Actions; Sentry optional |

#### 3.2 Existing features

| Category | Status | Detail |
|----------|--------|--------|
| **Pages** | ✅ | Home, about, contact, gallery, pricing, FAQ, reviews, services hub, 10 decoration + 7 partner service pages, 31 locality SSG pages |
| **Lead capture** | 🟡 | `POST /api/contact` — name, phone, email, eventType, eventDate, budget, message; Turnstile + rate limit |
| **Lead persistence** | 🔴 | `createLead.ts` comment: notify + webhook only; **no database** |
| **WhatsApp handoff** | ✅ | Post-submit opens pre-filled WhatsApp URL |
| **Email notify** | 🟡 | Resend — requires `RESEND_API_KEY` |
| **CRM webhook** | 🟡 | Generic `LEAD_WEBHOOK_URL` — **not wired to Lead Management Application in code** |
| **SEO** | ✅ | Sitemap, robots, JSON-LD, image sitemap, 301 `/areas` → `/locations` |
| **Analytics** | 🟡 | GA4 + conversion events if env set; Meta Pixel call exists but **loader not in layout** |
| **Google reviews** | 🟡 | Places API proxy + static fallbacks |
| **EventOS integration** | 🔴 | Zero references in codebase |

#### 3.3 Data ownership (verified)

| Data domain | Where it lives |
|-------------|----------------|
| Contact form leads | Ephemeral server memory → Resend email + optional webhook payload; **not stored** |
| WhatsApp / phone enquiries | 🔴 No server capture |
| Event photos (marketing) | Cloudinary CDN (`utils/gallery.ts`) |
| Customer CRM record | 🔴 Not created by website |

#### 3.4 Business Bible capability classification

| Capability | Status | Evidence |
|------------|--------|----------|
| Website enquiry intake | 🟡 | API exists; persistence depends on external webhook/email |
| SEO / online presence | ✅ | Locality pages, metadata, structured data |
| Lead source = website | 🟡 | `source: contact_form` on API path only |
| Auto-create lead in Lead Management Application | 🔵 | Requires `LEAD_WEBHOOK_URL` or Event OS endpoint — not in repo |
| Instagram / referral tracking on form | 🔴 | Single source tag on API path |

---

### 4. Consolidated data ownership (verified across apps)

| Data domain | Lead Mgmt App | Quotation/Billing App | Website | Informal (interview) |
|-------------|---------------|----------------------|---------|----------------------|
| Customer identity | ✅ Firestore `enquiries` | ✅ Hive `customers`/bill snapshot | 🟡 Transient API payload | WhatsApp |
| Leads / pipeline | ✅ Firestore `enquiries` | 🔴 | 🟡 Notify only | — |
| Event type/date/location | ✅ On enquiry | 🟡 Date + address on bill | ✅ Contact form fields | — |
| Quotation line items | 🔴 | ✅ Hive `bills` | 🔴 | — |
| Invoices / billing PDFs | 🔴 | ✅ Local PDF + Hive | 🔴 | — |
| Payments | 🟡 Fields on enquiry | 🔴 | 🔴 | UPI screenshots, cash |
| Payment proofs | 🔴 | 🔴 | 🔴 | WhatsApp, UPI, paper |
| Follow-ups | 🟡 Notes + UI | 🔴 | 🔴 | WhatsApp |
| Push notifications | ✅ FCM | 🔴 | 🔴 | — |
| Staff/users | ✅ `users/` admin/staff | 🔴 PIN only | 🔴 | WhatsApp groups |
| Vendor / inventory / ops | 🔴 | 🔴 | 🔴 | Memory, WhatsApp, paper |
| Event media (portfolio) | 🟡 Enquiry images (Storage) | 🔴 | ✅ Cloudinary | Google Drive |
| Profitability | 🔴 | 🔴 | 🔴 | Not calculated |

**Cross-app link:** No shared customer ID, enquiry ID, or sync mechanism exists in any repository.

---

### 5. Interview vs code — reconciled findings

| Topic | Interview said | Code verified | Reconciliation |
|-------|----------------|---------------|----------------|
| Two apps not integrated | Manual re-entry | No API/sync in either repo | ✅ Confirmed |
| Payment not linked | UPI/cash manual | Lead app: status fields only; billing app: no payments | ✅ Confirmed |
| Quotation in billing app | Yes | ✅ Full quote/invoice/PDF stack (offline) | ✅ Confirmed; stronger than interview implied |
| Lead app notifications | Yes | ✅ FCM + CF triggers | ✅ Confirmed |
| Website creates leads in Lead app | Implied intake flow | 🔴 Website does not persist or call Lead app | 🟡 **Gap:** intake is manual unless webhook configured in production env |
| Billing app for We Decor | We Decor usage | Code branded KA Furnitures; offline furniture GST tool | 🟡 **Clarify:** same repo, may need We Decor rebrand/config for production use |
| Staff create enquiries | Zakir usage | Admin-only create in Firestore rules | 🟡 **Clarify:** staff edit assigned; Ilyas/admin creates |
| Payment on enquiry | Interview pending Q4 | `advancePaid`, `paymentStatus` on enquiry doc | 🟡 Partial — fields exist; proofs and cross-app sync absent |

---

### 6. Reference Systems Capability Audit

*Source: repository code inspection (2026-07-08). Paths under `EventOS/reference-systems/`.*

**Purpose:** These are **not** We Decor daily operations. They are reusable reference implementations for Event OS architecture and module design.

---

#### 6.1 CRM System (`reference-systems/crm-system/`)

**Repository:** `wedecor/ACApplication` · **Product:** AC Platform — home-appliance repair CRM + service operations

##### Application overview

| Field | Verified detail |
|-------|-----------------|
| **Stack** | Turborepo monorepo; NestJS 10 (Fastify) + Prisma + PostgreSQL 16 + Redis; Next.js 15 (web + admin-crm); Expo 51 (customer + technician apps) |
| **Apps** | `api`, `web`, `admin-crm`, `technician-app`, `customer-app` |
| **Packages** | `@ac/types`, `@ac/database`, `@ac/auth`, `@ac/notifications`, `@ac/whatsapp`, `@ac/payments`, etc. |
| **Deployment** | Local: `docker-compose.yml` (Postgres, Redis, MailHog, MinIO); CI via GitHub Actions; no production K8s manifests in repo |

##### Existing features (verified modules)

| Domain | Status | Key paths |
|--------|--------|-----------|
| **Leads** | ✅ | `apps/api/src/modules/leads/` — CRUD, assignment, notes, timeline; states `NEW → CONTACTED → QUALIFIED → BOOKING_CREATED`; sources include WEBSITE, WHATSAPP, INSTAGRAM, GOOGLE_ADS, REFERRAL |
| **Public lead intake** | ✅ | `public-intake/` + `apps/web/src/app/api/lead/` — rate-limited website → API |
| **Bookings** | ✅ | `bookings/` — field-service job lifecycle (technician dispatch oriented) |
| **Quotations** | ✅ | `quotations/` — line items, GST (paise), public `viewToken` approval, convert to invoice |
| **Finance** | ✅ | `invoices/`, `payments/` (Razorpay/Stripe), `ledger/` (append-only), `pdf/`, `finance-analytics/` |
| **Inventory** | ✅ | `inventory/` — warehouses, PO, GRN, transfers, van stock, append-only ledger, alerts |
| **Dispatch + GPS** | ✅ | `dispatch/`, `assignment/`, `tracking/`, `routing/`, `sla-monitor/` |
| **Notifications** | ✅ | `packages/notifications/` — domain-event-driven, multi-channel (WhatsApp, SMS, email, push) |
| **Support / omnichannel** | ✅ | `support/` — ticketing, WhatsApp inbox, call center hooks |
| **Website / SEO** | ✅ | `apps/web/` — programmatic city × service pages, booking funnel, JSON-LD |
| **Orchestration** | ✅ | `orchestration/` — workflow rules + automation |

##### Data ownership patterns

- **`tenantId`** on all operational rows (multi-tenant SaaS model)
- **Lead → Booking** 1:1 on conversion; **Booking → Quotation/Invoice** linked
- **Money** in integer minor units (paise); **inventory** via append-only `InventoryLedger` + warehouse snapshots
- **Domain events** → Redis pub/sub → notifications + realtime (Socket.io)
- **Audit** + soft-delete via Prisma extensions

##### Relevance to Event OS / Business Bible

| Capability | Classification | Notes |
|------------|----------------|-------|
| Lead pipeline + source tracking | ✅ **Strong reference** | Maps to Docs `04`, `10`, `19` |
| Website → CRM lead intake | ✅ **Strong reference** | Fills gap in current `wedecor-website` (no persistence today) |
| Quotation + invoice + GST + ledger | ✅ **Strong reference** | Maps to Docs `04`, `09`; exceeds current offline billing app |
| Notifications (event-driven) | ✅ **Strong reference** | Adapt with Doc `17` human-approval gates |
| Monorepo + RBAC + audit patterns | ✅ **Strong reference** | Platform plumbing for Event OS |
| Booking lifecycle | 🟡 **Adapt** | Field-service states ≠ event decoration ops (packing, vendors, multi-day) |
| Inventory module | 🟡 **Adapt** | Warehouse/van spare-parts ≠ reusable decor props + event movement states (Doc `08`) |
| Vendor / procurement | 🟡 **Adapt** | PO/GRN model ≠ per-event procurement + budget variance (Doc `07`) |
| Technician dispatch + GPS | 🔴 **Not applicable** | Event OS: staff recommendations, Zakir decides (Doc `06`, `17`) |
| AMC / subscriptions | 🔴 **Not applicable** | Appliance maintenance model |
| Call center / omnichannel support | 🔴 **Defer** | Doc `12` Phase 1 needs timeline + issue notes only |
| Event profitability view | 🔵 **Event OS build** | Finance analytics booking-oriented; not event P&L |
| Operations workspace at Approved | 🔵 **Event OS build** | No equivalent in AC Platform |
| Human-approval automation guardrails | 🔵 **Event OS build** | Orchestration auto-executes; Doc `17` requires approval |

---

#### 6.2 Inventory System (`reference-systems/inventory-system/`)

**Repository:** `wedecor/inventory-system` · **Product:** Yuvaminds Autoparts ERP (README still says "skeleton" — **code is a full ERP**)

##### Application overview

| Field | Verified detail |
|-------|-----------------|
| **Stack** | Spring Boot 3.5 + Java 21 + PostgreSQL 17 + Flyway; React 19 + Vite frontend; Expo mobile POS |
| **Scale** | ~314 Java source files, 33 Flyway migrations, 33 REST controllers, extensive integration tests |
| **Deployment** | `docker-compose.yml` (dev); `docker-compose.prod.yml` (nginx, prometheus, grafana, backup cron) |

##### Existing features (verified)

| Domain | Status | Detail |
|--------|--------|--------|
| **Item master** | ✅ | SKU, categories, HSN, GST rate, reorder level, barcodes/QR |
| **Multi-location stock** | ✅ | `locations` + per-location `stock_balances`; user-location RBAC |
| **Stock ledger** | ✅ | Append-only `stock_ledger` (DB triggers prevent mutation); rebuildable balances |
| **Purchases** | ✅ | PO → GRN → purchase invoice |
| **Sales** | ✅ | Quotation → sales order → invoice; POS checkout (web + mobile) |
| **GST / compliance** | ✅ | CGST/SGST/IGST, GSTR-1, GSTR-2B, e-invoice, e-way bill |
| **Accounting** | ✅ | Chart of accounts, journal entries, trial balance, P&L, Tally export |
| **Payments** | ✅ | Party ledger, allocations, receivables/payables |
| **WhatsApp** | ✅ | Invoice delivery integration |

##### Data ownership patterns

- Flyway-owned schema; Hibernate validate-only
- Stock truth = append-only ledger; posted documents immutable
- Location-scoped access (`user_locations`, default-deny)
- Gapless FY-aware document numbering per location

##### Relevance to Event OS / Doc 08

| Doc 08 requirement | Classification | Notes |
|--------------------|----------------|-------|
| Inventory categories + item master | 🟡 **Partial fit** | Categories exist; no Reusable/Consumable/Per-event taxonomy |
| Storage locations (JP Nagar) | ✅ **Good pattern** | Multi-location + RBAC matches storage model |
| Purchase / acquisition | 🟡 **Partial fit** | PO/GRN for buying stock; no event linkage |
| Stock quantity tracking | ✅ **Strong pattern** | Append-only ledger reusable for quantity accounting |
| Movement states (Planned → Picked → Packed → Loaded → At Venue → Returned → Cleaned) | 🔴 **Missing** | Only trade-document stock moves (invoice, GRN, transfer) |
| Event-linked packing lists | 🔴 **Missing** | No event entity |
| Photos on items/movements | 🔴 **Missing** | |
| Condition / maintenance / last-used event | 🔴 **Missing** | |
| Damage/loss workflow | 🟡 **Partial** | Stock adjustments + reason codes only |
| Auto-parts / POS / vehicle fitment | 🔴 **Not applicable** | Wholesale retail ERP, not event prep |

**Bottom line:** Strong **ERP backbone reference** (ledger, locations, purchases, RBAC, Indian GST). Event OS Inventory Phase 1 still needs a new **event-linked operational movement layer** per Doc `08`.

---

#### 6.3 Django CRM Capability Audit

**Repository:** `reference-systems/autoparts-erp-django/` (`wedecor/CRMDjango`)

> **Naming correction (verified in code):** Despite the GitHub/repo folder name, this is **not a CRM**. Internal identity is **autoparts-erp-django** — a Django port of the autoparts inventory/ERP system (same domain family as `inventory-system/` Spring Boot). OpenAPI title: *"Autoparts ERP API"* (`backend/config/settings/base.py`). Docker project: `autoparts-erp-django` (`backend/docker-compose.yml`).

**Audit purpose:** Reference architecture and product patterns only. Does **not** assume superiority over AC Platform, We Decor apps, or Business Bible requirements.

---

##### 6.3.1 Technology landscape

| Layer | Verified detail |
|-------|-----------------|
| **Backend** | Django **5.0.13** + Django REST Framework **3.15.2**; Python 3.12 |
| **Architecture** | 27 Django apps under `backend/apps/`; models `managed = False` (SQL-migration-owned schema, Flyway-port pattern) |
| **Frontend** | React **19** + TypeScript + Vite **8** + Tailwind **4** + TanStack Query (`frontend/`) |
| **Mobile** | Expo **~51** + React Native — **POS billing app**, not CRM (`mobile/`) |
| **Database** | PostgreSQL **17** only (`autoparts_erp`); Redis for cache + Celery |
| **API** | REST (DRF ViewSets); OpenAPI via `drf-spectacular` (`/api/docs/`) — **no GraphQL** |
| **Auth** | JWT (`simplejwt` — 30 min access / 7 day refresh); TOTP 2FA; RBAC (22 permission codes); location-scoped queries |
| **Deployment** | Docker Compose: Postgres, Redis, gunicorn + WhiteNoise, Celery worker/beat; Sentry in prod |
| **Spec source** | `reference/schema-design.md` + `reference/V*.sql` (shared with Spring Boot ERP) |
| **Docs** | `docs/ARCHITECTURE.md` — explicit Django port of autoparts ERP |

---

##### 6.3.2 CRM capabilities check

*Searched models, apps, and frontend routes for lead/pipeline/CRM constructs. **No `Lead`, enquiry, or pipeline models exist.***

| Area | Capability | Present? | Where / notes |
|------|------------|----------|---------------|
| **Sales** | Lead capture | 🔴 | No lead entity. Marketplace `ChannelOrder` is B2B order import, not sales CRM |
| | Lead pipeline / stages | 🔴 | No opportunity/deal pipeline |
| | Source tracking | 🔴 | No lead-source taxonomy |
| | Assignment | 🔴 | User-location scoping only; no lead assignee |
| | Follow-ups | 🔴 | No follow-up or reminder model |
| | Tasks / reminders | 🔴 | Celery jobs only (e.g. overdue invoice email); no user task entity |
| **Customer** | Customer profile | 🟡 | `Party` master (`apps/masters/models.py`) — ERP customer/supplier with GSTIN, not CRM contact |
| | Contact history | 🔴 | No activity timeline |
| | Communication timeline | 🔴 | Email/WhatsApp invoice send only (`apps/notifications/`, `apps/whatsapp/`) |
| **Operations** | Workflow management | 🟡 | PO approval, RMA, stock-count workflows — ERP ops, not event execution |
| | Checklists | 🔴 | Stock count lines only |
| | Assignments | 🔴 | No crew/technician assignment |
| | Status transitions | 🟡 | Document `DRAFT → POSTED → CANCELLED` only |
| **Finance** | Quotations | ✅ | `Document.doc_type = QUOTATION` — ERP sales document |
| | Payments | ✅ | `Payment`, `PaymentAllocation`, `CashSession`; Razorpay gateway links |
| | Expenses | 🟡 | Purchase invoices / landed costs — not per-event expenses |
| | Reports | ✅ | GSTR-1/2B, P&L, stock valuation, profitability reports, Tally export |
| **Platform** | User roles | ✅ | `ADMIN`, `SALES`, `PURCHASE`, `ACCOUNTANT` + 22 permissions |
| | Permissions | ✅ | RBAC + location default-deny (`apps/security/`) |
| | Notifications | 🟡 | Email overdue reminders, WhatsApp invoice — no in-app inbox |
| | Audit logs | ✅ | Append-only `AuditLog` (`apps/control/`) |
| | Multi-tenant readiness | 🟡 | `Organization` + `OrganizationMembership` (`apps/tenancy/`) — partial SaaS scaffold |
| | Configuration | 🟡 | Document series, reason codes, price tiers — ERP config, not CRM dropdowns |

**ERP capabilities present (not CRM, but substantial):** inventory ledger, POS checkout, GST/e-invoice/e-way bill, accounting GL, batches/serials, marketplace scaffold, customer/vendor portals.

---

##### 6.3.3 Comparison — Django repo vs AC Platform vs We Decor lead app

**Legend (Event OS relevance):** ✅ Reusable pattern · 🟡 Needs adaptation · 🔴 Not relevant · 🔵 Already exists elsewhere

| Capability | Django repo (`autoparts-erp-django`) | AC CRM (`crm-system`) | We Decor (`lead-management-app`) | Relevance to Event OS |
|------------|---------------------------|------------------------|----------------------------------|------------------------|
| Lead capture | 🔴 None | ✅ `leads/` + public intake | ✅ Enquiry CRUD | 🔵 **LM** — reuse/migrate; AC↯ pattern for website intake |
| Lead pipeline / stages | 🔴 None | ✅ Lead + booking state machines | ✅ New → In Talks → Approved → Completed | 🔵 **LM** + 🟡 AC↯ booking adaptation |
| Lead source tracking | 🔴 None | ✅ `LeadSource` enum | ✅ Source dropdown + analytics | 🔵 **LM** |
| Lead assignment | 🔴 None | ✅ Assign + timeline | ✅ `assignedTo` + FCM | 🔵 **LM** |
| Follow-ups / tasks | 🔴 None | ✅ Lead notes/activities | 🟡 Notes + dashboard reminder | 🟡 Extend LM; not in Django repo |
| Customer profile | 🟡 `Party` ERP master | ✅ `Customer` entity | 🟡 Embedded on enquiry | 🟡 Unified customer in Event OS |
| Communication timeline | 🔴 None | ✅ Activity module | 🔴 WhatsApp external | 🔴 **New build** (Doc 12) |
| Event / ops workspace | 🔴 None | 🟡 Booking (wrong domain) | 🔴 None | 🔴 **New build** (Doc 05) |
| Checklists | 🔴 None | 🟡 Job checklists | 🔴 None | 🔴 **New build** (Doc 13) |
| Quotations + line items | ✅ ERP `Document` | ✅ `Quotation` + approval | 🔴 None (offline QB separate) | 🟡 AC↯ quote pattern; migrate QB capability |
| Payments + ledger | ✅ ERP payments/GL | ✅ Razorpay + customer ledger | 🟡 Fields on enquiry only | 🟡 AC↯ ledger pattern; 🔵 partial in LM |
| Event profitability | 🟡 Item/cost reports | 🟡 Booking analytics | 🔴 None | 🔴 **New build** (Doc 09) |
| Inventory / stock ledger | ✅ Full module | ✅ Warehouse ERP module | 🔴 None | 🟡 Django + INV↯ **ledger pattern** for quantity layer (Doc 08) |
| RBAC + audit | ✅ JWT + permissions + audit log | ✅ RBAC + Prisma audit | 🟡 admin/staff | ✅ Reusable **platform pattern** (both refs) |
| Multi-tenant | 🟡 `Organization` | ✅ `tenantId` everywhere | 🔴 Single Firebase project | 🔵 Future SaaS (Doc 20) — AC↯ stronger |
| Notifications (push/in-app) | 🟡 Email/WhatsApp only | ✅ Domain-event dispatcher | ✅ FCM + inbox | 🔵 **LM**; 🟡 AC↯ for multi-channel |
| POS / GST / e-invoice | ✅ Core strength | 🟡 Service invoices | 🔴 None | 🔴 **Not Phase 1** for We Decor (Doc 09) |
| Website lead intake | 🔴 None | ✅ Web → API persist | 🔴 WEB ephemeral | 🟡 AC↯ pattern; integrate WEB |

---

##### 6.3.4 Audit conclusion — impact on Phase 1 architecture

| Question | Answer |
|----------|--------|
| Is this a CRM reference? | **No** — autoparts ERP/inventory/POS (Django port of same spec family as `inventory-system/`) |
| Should it replace AC Platform for CRM patterns? | **No** — AC Platform remains the CRM/service-ops reference |
| Should it replace We Decor lead app patterns? | **No** — lead-management-app remains the enquiry CRM reference |
| Does it duplicate `inventory-system/`? | **Yes** — same autoparts domain; Django vs Spring Boot implementation |
| What is it useful for? | **ERP platform patterns:** DRF + OpenAPI, JWT/RBAC, append-only audit, document posting, stock ledger, Celery jobs, React admin SPA, Expo POS |
| Does it change Doc 19 matrix decisions? | **Not yet** — pending founder review. Preliminary: **no change to CRM Phase 1 posture**; optional **secondary ERP reference** alongside Spring Boot inventory-system for Django stack preference only |

**Recommendation (reference only, not a decision):** Keep `autoparts-erp-django` under `reference-systems/` (as a reference ERP). Do **not** add to Doc 19 capability matrix as a CRM column until explicitly approved.

---

#### 6.4 Reference vs current-systems summary

| Capability | Current We Decor | AC Platform (ref) | Autoparts ERP Java (ref) | Django ERP (ref) |
|------------|------------------|-------------------|--------------------------|------------------|
| Lead CRM | ✅ Firebase app | ✅ Full module | 🔴 | 🔴 |
| Website lead intake | 🟡 Ephemeral API | ✅ Public intake + persist | 🔴 | 🔴 |
| Quotations | 🟡 Offline Hive app | ✅ + public approval | ✅ Sales docs | ✅ Sales docs |
| Payments / ledger | 🟡 Fields only | ✅ Razorpay + ledger | ✅ Full accounting | ✅ Full accounting |
| Event operations | 🔴 WhatsApp/memory | 🟡 Booking (wrong domain) | 🔴 | 🔴 |
| Inventory (event-centric) | 🔴 | 🟡 Warehouse-centric | 🟡 Quantity-centric | 🟡 Quantity-centric |
| Multi-tenant SaaS | 🔴 | ✅ Built-in | 🔴 | 🟡 Organization scaffold |

*Django repo (`autoparts-erp-django`) is functionally an ERP twin of `inventory-system/`, not a third CRM.*

---

### 7. Phase 1 implications (from audit → Doc 19)

Capabilities **already implemented** in current systems that Event OS should **preserve or migrate**, not rebuild from scratch:

- Lead pipeline, kanban, assignment, FCM notifications (lead app)
- Lead source analytics and CSV export (lead app)
- WhatsApp review-request flow (lead app)
- Quotation/invoice PDF with line items and GST (billing app — migrate/replatform)
- Website SEO surface and contact API shape (website — wire to Event OS lead endpoint)

Capabilities **confirmed missing** in code (align with Business Bible 🔴):

- Unified event record across lead + quote + payment
- Payment proof storage and verification workflow
- Operations workspace, vendor, inventory, staff allocation
- Event profitability
- Website → CRM automatic lead creation (without env webhook)
- Business rule hard blocks (advance before Approved, etc.)

---


### Current State

**Not Yet Interviewed (Zakir).**

### Future Vision

Role-based access in Event OS (founders, operations, staff) with audit trail.

---

## 5. Migration & Coexistence (Event OS Adoption)

### Current State

**Not Defined.**

### Future Vision

**Not Defined** — to be aligned with `19-event-os-phase1-requirements.md` and `/docs/11-roadmap.md`.

Questions to resolve:

- Which legacy applications remain during Phase 1?
- Cutover criteria per module
- Data migration vs parallel run

---

## 6. Risks & Dependencies

| Risk | Why It Matters | Status |
|------|----------------|--------|
| Disconnected applications | Data fragmentation, Zakir dependency | Documented in `02`, `16` |
| WhatsApp as system of record | History not searchable/structured | Documented in `03`, `04` |
| No inventory/finance system | Cannot measure profitability | Documented in `08`, `09`, `16` |

---

## 7. Event OS Technology Direction — Discovery Summary

**Purpose:** Summarize what system discovery (interviews + code audits) implies for Event OS direction—without inventing new requirements. Business Bible documents remain the source of truth for *what* must be built.

### 7.1 Current We Decor System Strategy

#### 7.1.1 `current-systems/lead-management-app/` (We Decor Enquiries)

- **Classification**: **Keep + Extend** (migrate into Event OS over time)
- **Current purpose**: Lead/enquiry CRM (capture, pipeline, assignment, basic analytics, review requests)
- **Existing capabilities (verified)**:
  - Enquiries pipeline (New → In Talks → Approved → Completed), kanban, calendar, assignment, FCM notifications, analytics, CSV export
  - Review-request WhatsApp flow
- **What Event OS should reuse**:
  - Lead pipeline behaviours, assignment + notifications patterns, KPI/source analytics baseline, review-request flow
- **What needs extension (per Business Bible)**:
  - Structured follow-ups (beyond notes), communication timeline, payment proof capture, hard-block rules (`14`), unified event record (lead → quote → ops → finance)
- **What will eventually move into Event OS**:
  - Lead + customer identity as part of a single event lifecycle workspace (Doc `19` consolidation; Doc `16` pain #1 reduction)
- **Reasoning**:
  - This is the strongest existing production capability set; rebuilding it would duplicate working features and increase fragmentation.

#### 7.1.2 `current-systems/quotation-billing-app/` (KABilling)

- **Classification**: **Integrate + Replace later**
- **Current purpose**: Offline quotation/invoice creation with GST PDFs and export (single-device)
- **Existing capabilities (verified)**:
  - Quotes/invoices with line items + GST, PDF generation, amendments/cancel-with-reason, monthly exports
  - **No** payment tracking on active model; **no** cloud sync; **no** link to lead system
- **What Event OS should reuse**:
  - Billing document behaviours (quote/invoice/PDF) and audit-friendly concepts (finalize/lock/amend) as *product patterns*
- **What needs extension (per Business Bible)**:
  - Link quotations/billing to a single event record; payment lifecycle + proofs; profitability (revenue − vendor expenses)
- **What will eventually move into Event OS**:
  - Quotation and billing become Event OS-native (Phase 1 or phased cutover); offline app becomes unnecessary
- **Reasoning**:
  - Existing billing capability exists but is disconnected and offline; long-term it increases duplication and prevents event profitability.

#### 7.1.3 `current-systems/wedecor-website/` (We Decor Website)

- **Classification**: **Keep + Integrate**
- **Current purpose**: SEO/marketing site + enquiry intake
- **Existing capabilities (verified)**:
  - Strong SEO surface (localities/services), contact API with validation/rate limits/Turnstile, WhatsApp handoff
  - Lead data is **not persisted** by the website itself; optional webhook/email only
- **What Event OS should reuse**:
  - Lead intake data shape (contact form fields) and conversion flow patterns (WhatsApp handoff)
- **What needs extension (per Business Bible)**:
  - Ensure website enquiries reliably create leads in the system of record (Event OS / unified CRM)
- **What will eventually move into Event OS**:
  - Website remains a marketing surface; Event OS becomes the operational system of record behind it
- **Reasoning**:
  - Website is effective for acquisition; the missing piece is consistent lead persistence and linkage to operations.

---

### 7.2 Reference System Learnings

#### 7.2.1 `reference-systems/crm-system/` (AC Platform — CRM/service ops reference)

Reusable patterns (not business rules):

- **CRM workflows & lead pipelines**: lead notes/timeline, source taxonomy, conversion chains
- **Notifications**: event-driven, multi-channel dispatch (adapt to Doc `17` human-approval boundaries)
- **Permissions/RBAC**: structured roles/permissions; auditability
- **Auditability**: consistent activity logs and change attribution
- **SaaS readiness**: tenant-scoped data model (useful later for Doc `20`)

#### 7.2.2 `reference-systems/autoparts-erp-django/` (Django Autoparts ERP)

Reusable patterns (not business rules):

- **Django/DRF architecture**: modular apps, REST + OpenAPI, background jobs (Celery)
- **ERP document patterns**: quotation/invoice/payment allocation, posting/immutability concepts
- **RBAC + audit logs**: permissions, location scoping, append-only audit tables
- **Inventory/ERP structures**: stock ledger and master-data patterns (quantity-centric, not event-centric)

#### 7.2.3 `reference-systems/inventory-system/` (Spring Boot Autoparts ERP)

Reusable patterns (not business rules):

- **Inventory ledger**: append-only movements + derived balances (good foundation for inventory quantity truth)
- **Purchase workflows**: PO → GRN → purchase invoice
- **Location-based inventory**: multi-location stock + user-location permissions

---

### 7.3 Event OS Design Principles (From Discovery)

1. **Extend before rebuilding.**
2. **Reuse existing We Decor functionality** wherever it already works (especially the Lead Management app).
3. **Reference systems provide patterns, not business rules.**
4. **Business Bible defines requirements** (Docs `01`–`19`)—code audits only validate current capability reality.
5. **No automation replaces human approval** for business decisions (Doc `17`).
6. **Avoid duplicate systems and fragmented data**—Event OS must converge toward a single event record.

---

### 7.4 Phase 1 Impact Summary (Business-focused)

#### Reuse

- Lead pipeline + assignment + notifications + analytics baseline (from `lead-management-app`)
- Review-request WhatsApp flow (from `lead-management-app`)
- Website SEO surface and contact flow patterns (from `wedecor-website`)

#### Extend

- Follow-ups → structured follow-up tracking (Doc `04`)
- Payments → event-linked payment records + proofs (Doc `09`)
- KPIs → event gross margin/profitability visibility (Docs `09`, `15`)
- Business rule enforcement → hard blocks for advance/financial review/ownership (Doc `14`)

#### Integrate

- Website enquiries → reliably create leads in Event OS / system of record (Docs `03`, `04`, `10`, `18`)
- Legacy billing app → parallel-run during cutover only (Docs `04`, `09`, `18`)

#### Build New

- Event operations workspace at Approved (Docs `05`, `17`)
- Vendor master + per-event procurement + variance + issue notes (Doc `07`)
- Inventory master + event movement states + packing + returns + damage/loss (Doc `08`)
- Customer communication timeline + lightweight issue notes (Doc `12`)
- Event profitability view (Docs `09`, `16`)

#### Deferred

- Multi-tenant SaaS readiness as a primary goal (Doc `20`)
- Advanced marketing attribution (ad spend → revenue) beyond current manual tracking (Doc `10`)
- Full ticketing/call-center-grade support workflow (Doc `12`)
- Automated customer/vendor/staff actions without explicit human approval (Doc `17`)

---

## 8. Event OS Implications (High Level)

*Detailed requirements deferred to `19-event-os-phase1-requirements.md`.*

| Current gap | Event OS direction |
|-------------|-------------------|
| Disconnected lead + quote apps | Unified lead → quote → booking |
| No ops workspace at Approved | Auto-create operations workspace |
| Informal finance/vendor/inventory | Structured modules with human approval |

---

## 9. Current State (Consolidated Snapshot)

| Area | Summary |
|------|---------|
| Core apps | 2 custom internal apps: Lead Management + Quotation and Billing |
| Channels | Website, WhatsApp, Instagram, Facebook, Google Business Profile |
| Storage | Google Drive + informal payment proofs; no structured ops DB |
| Missing systems | No inventory, accounting, ERP, or centralized ops platform |
| Users | Founders (Ilyas + Zakir) on core apps; Ilyas on marketing/web; WhatsApp spans all parties |
| Data in apps | Sales/billing in 2 apps; customer/event fields **duplicated**; manual re-entry at quotation |
| Data outside apps | Vendor, inventory, staff, packing, proofs, profitability, media — WhatsApp/Drive/UPI/paper/memory |
| Workflow | 6-step journey; execution entirely outside apps; payment not linked across systems |
| **Code audit** | Lead app: mature Firebase CRM; billing app: offline GST quotes/invoices (KA Furnitures branding); website: SEO + ephemeral lead API |

---

## 10. Future Vision (Consolidated Snapshot)

Event OS as primary system of record with integrations only where required (e.g., WhatsApp as channel, not database).

---

## 11. Document Status

| Field | Value |
|-------|-------|
| **Version** | 0.1 |
| **Status** | Draft |
| **Approval** | Not Approved |
| **Interview status** | Q1–Q3: **Captured**; Q4 payment/status sync: **Pending** |
| **Code audit status** | `current-systems/`: **Captured**; `reference-systems/`: **Captured** incl. `autoparts-erp-django` ERP audit (§6.3) |
| **Next step** | Interview Q4 (payment recording); align audit findings with founder on billing app branding/usage; finalize discovery summary (§7) |

**Next document:** [19-event-os-phase1-requirements.md](./19-event-os-phase1-requirements.md)
