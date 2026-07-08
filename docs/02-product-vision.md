# Event OS — Product Vision

## Purpose of This Document

This document describes what Event OS is, who it serves, what it will become, and the experience we aim to deliver. It is the north star for product and engineering decisions. When prioritizing features or resolving design debates, return to this document.

---

## One-Line Definition

**Event OS is an AI-powered business operating system that helps event management companies acquire clients, deliver events, and grow profitably—from first inquiry to final invoice.**

---

## The Problem

Event management companies operate in chaos:

| Pain Point | Current Reality | Cost |
|------------|-----------------|------|
| **Fragmented tools** | Leads in Instagram DMs, quotes in Word, bookings in spreadsheets, tasks in WhatsApp groups | Context switching, errors, lost information |
| **No single source of truth** | "Which version of the quote did the client approve?" | Rework, disputes, margin erosion |
| **Manual coordination** | Staff assignments via phone calls; vendor confirmations via text | Missed deadlines, double bookings |
| **Reactive management** | Owners discover problems after events, not before | Client dissatisfaction, refund requests |
| **Growth ceiling** | Processes don't scale; hiring means more chaos | Revenue capped by operational capacity |
| **Invisible analytics** | No clear picture of lead conversion, event profitability, or staff utilization | Decisions by gut feel |

Existing software either targets large enterprises (too complex, too expensive) or offers narrow point solutions (CRM only, calendar only) that don't connect.

---

## The Solution

Event OS unifies the entire event business lifecycle in one intelligent platform:

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           EVENT OS                                       │
├─────────────┬─────────────┬─────────────┬─────────────┬─────────────────┤
│   ACQUIRE   │   CONVERT   │   DELIVER   │    GROW     │   INTELLIGENCE  │
├─────────────┼─────────────┼─────────────┼─────────────┼─────────────────┤
│ CRM         │ Quotation   │ Calendar    │ Marketing   │ AI Assistants   │
│ Lead Mgmt   │ Booking     │ Tasks       │ Instagram   │ Reports         │
│ Website CMS │             │ Staff       │ SEO         │ BI              │
│             │             │ Vendors     │ WhatsApp    │ Automation      │
│             │             │ Inventory   │             │                 │
│             │             │ Finance     │             │                 │
└─────────────┴─────────────┴─────────────┴─────────────┴─────────────────┘
```

Each capability is a **module** with clear boundaries (see [06-module-design.md](./06-module-design.md)). Modules share a common data model centered on the **Event** and **Client** aggregates.

---

## Target Users

### Primary: Event Management Company (Tenant)

Small to mid-size event management companies (5–100 staff) that handle weddings, corporate events, social celebrations, and decorative services.

**Not** large venue operators, **not** ticketing platforms, **not** freelance individual planners (initially)—though the architecture should not preclude these segments later.

### User Personas

| Persona | Role | Primary Needs |
|---------|------|---------------|
| **Owner / Director** | Business leadership | Revenue visibility, pipeline health, profitability per event, team performance |
| **Sales Manager** | Lead conversion | Lead tracking, fast quoting, follow-up automation, conversion analytics |
| **Operations Manager** | Event delivery | Calendar, staff scheduling, vendor coordination, task tracking, inventory |
| **Coordinator** | Day-to-day execution | Task lists, client communication, checklist completion |
| **Finance / Accounts** | Money management | Invoicing, payments, expenses, reconciliation, tax reports |
| **Marketing** | Growth | Campaign tracking, Instagram insights, website content, SEO |
| **Client** (external) | Event host | View quotes, approve bookings, track event progress (future portal) |

Each persona accesses a role-appropriate view of the same underlying data. No duplicate entry.

---

## Product Capabilities (Full Vision)

### Phase: Foundation (MVP)

Capabilities required for We Decor to run daily operations:

- **CRM** — Client and contact management with interaction history
- **Lead Management** — Capture, qualify, assign, and track leads through pipeline stages
- **Quotation** — Create, send, revise, and track quotations with line items and packages
- **Booking** — Convert approved quotes to confirmed bookings with event details
- **Calendar** — Unified view of events, tasks, and staff availability
- **Task Management** — Assignable tasks linked to events with due dates and status
- **Authentication & Authorization** — Secure login with role-based access

### Phase: Operations

- **Staff Management** — Profiles, roles, availability, assignments, performance
- **Vendor Management** — Vendor directory, contracts, rate cards, assignment to events
- **Inventory** — Track decorative items, equipment, consumables; allocation to events

### Phase: Finance

- **Invoicing** — Generate invoices from bookings; partial and milestone billing
- **Payments** — Record payments; integrate payment gateways
- **Expenses** — Track event and operational expenses
- **Financial Reports** — P&L per event, cash flow, outstanding receivables

### Phase: Growth

- **Marketing** — Campaign management, lead source attribution
- **Instagram Analytics** — Connect Instagram business accounts; track engagement and leads
- **Website CMS** — Manage public website content, galleries, service pages
- **SEO** — Meta management, sitemap, structured data for event services

### Phase: Intelligence

- **AI Assistants** — Context-aware assistants for quoting, client communication, scheduling suggestions
- **WhatsApp Automation** — Automated responses, follow-ups, status updates via WhatsApp Business API
- **Reports & BI** — Custom dashboards, scheduled reports, export
- **Predictive Insights** — Lead scoring, demand forecasting, margin optimization suggestions

---

## Core User Journeys

### Journey 1: Lead to Booking

```
Inquiry (Instagram/Website/WhatsApp)
    → Lead created automatically or manually
    → Sales assigns and qualifies
    → Site visit / consultation scheduled
    → Quotation generated (AI-assisted)
    → Quote sent to client
    → Client approves (portal or manual confirmation)
    → Booking confirmed
    → Calendar updated, tasks generated, staff notified
```

**Success criterion:** This journey completes in Event OS with zero spreadsheet exports.

### Journey 2: Event Delivery

```
Booking confirmed
    → Operations reviews event requirements
    → Staff and vendors assigned
    → Inventory allocated
    → Tasks created from event template
    → Pre-event checklist completed
    → Event executed
    → Post-event tasks (tear-down, returns, feedback)
    → Final invoice generated
    → Payment recorded
```

**Success criterion:** Operations manager sees real-time status of all active events on one dashboard.

### Journey 3: Business Review

```
Owner opens dashboard
    → Pipeline: leads by stage, conversion rates
    → Operations: events this week, overdue tasks, staff utilization
    → Finance: revenue MTD, outstanding invoices, event margins
    → AI insight: "3 quotes expiring this week; 2 events at risk of inventory shortage"
```

**Success criterion:** Owner makes Monday morning decisions from Event OS data, not manual reports.

---

## Differentiation

| Competitor Approach | Event OS Approach |
|--------------------|-------------------|
| Generic CRM adapted for events | Domain-native data model (events, packages, venues, vendors) |
| Separate tools per function | Unified OS with shared context |
| AI as marketing feature | AI embedded in workflows (quote generation, scheduling, communication) |
| Enterprise complexity | Right-sized for SMB event companies |
| US/EU-centric | Built for Indian and global SMB event markets (multi-currency, WhatsApp-first) |

---

## Multi-Tenancy Vision

### Today: Single Tenant (We Decor)

- One database, one tenant context
- Tenant abstraction exists in code (`tenant_id` on all tenant-scoped entities)
- Configuration stored in tenant settings, not hard-coded

### Tomorrow: Multi-Tenant SaaS

- Shared infrastructure, isolated data per tenant
- Self-service onboarding and configuration
- Per-tenant branding, workflows, and integrations
- Usage-based or seat-based pricing

**Why architect for multi-tenancy now:** Retrofitting tenant isolation into a single-tenant codebase is one of the most expensive rewrites in SaaS. The marginal cost of `tenant_id` from day one is near zero; the cost of adding it later is months of engineering.

---

## Non-Goals (Explicit)

Event OS will **not**:

1. **Replace general accounting software** — We integrate with Tally, Zoho Books, QuickBooks; we don't replicate full GL.
2. **Be a generic project management tool** — Tasks exist in service of events, not as standalone projects.
3. **Compete with design tools** — No Canva/Figma replacement; we may integrate or store assets.
4. **Handle venue-only operations** — We serve event management companies, not standalone venue booking platforms (initially).
5. **Support arbitrary business types** — We are event-domain-specific, not a horizontal ERP.

Stating non-goals prevents scope creep and keeps engineering focused.

---

## Quality Bar

Event OS must feel:

- **Fast** — Core actions (create lead, generate quote, view calendar) complete in < 2 seconds
- **Reliable** — 99.9% uptime target; no data loss
- **Intuitive** — A coordinator with basic computer skills completes core tasks without training manual
- **Trustworthy** — Financial figures match reality; audit trail for all changes
- **Intelligent** — AI suggestions are helpful, not noisy; always explainable and overridable

---

## Related Documents

| Document | Topic |
|----------|-------|
| [04-business-domain.md](./04-business-domain.md) | Domain model and ubiquitous language |
| [06-module-design.md](./06-module-design.md) | Module breakdown and boundaries |
| [11-roadmap.md](./11-roadmap.md) | Phased delivery timeline |
| [17-ui-design-system.md](./17-ui-design-system.md) | UX and visual design direction |

---

*Last updated: 2026-07-06*
*Owner: Product & Engineering*
