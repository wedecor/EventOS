# Yuva Minds — Company

## Purpose of This Document

This document defines who Yuva Minds is, why the company exists, and the engineering culture that governs every technical decision. Future engineers and AI agents should read this first to understand the organizational context behind Event OS.

---

## Company Identity

| Attribute | Value |
|-----------|-------|
| **Name** | Yuva Minds |
| **Mission** | Build AI-powered operating systems for service businesses |
| **First Product** | Event OS |
| **First Customer** | We Decor Events (internal validation partner) |
| **Long-term Model** | Multi-tenant SaaS for event management companies globally |

**Yuva** (युव) means youth in Sanskrit and Hindi. The name reflects our belief that service businesses deserve modern, intelligent software—not legacy tools built for a different era. **Minds** reflects our conviction that AI amplifies human judgment; it does not replace it.

---

## What We Build

Yuva Minds builds **operating systems**, not point solutions.

An operating system for a service business is:

- A single source of truth for customers, operations, and finances
- A workflow engine that connects lead → quote → booking → delivery → payment
- An intelligence layer that surfaces insights, automates routine work, and assists staff
- A platform that grows with the business from 5 employees to 500

We do not build "another CRM" or "another calendar app." We build the **system of record and system of action** for how event companies run.

---

## Strategic Positioning

### Vertical Focus: Event Management

Event management is our first vertical because:

1. **High operational complexity** — Multiple stakeholders (clients, vendors, staff), time-sensitive deliverables, and inventory-heavy workflows create genuine need for integrated software.
2. **Fragmented tooling** — Most event companies run on spreadsheets, WhatsApp, Instagram DMs, and disconnected SaaS tools.
3. **AI leverage** — Natural language (client inquiries), visual content (Instagram), scheduling, and document generation are all high-value AI application surfaces.
4. **Validation path** — We Decor Events provides a real operating environment to validate assumptions before scaling to multi-tenant SaaS.

### Horizontal Capability: Service Business OS Patterns

Although Event OS targets event management, architectural patterns (tenant isolation, workflow engines, quotation pipelines, staff scheduling) generalize to other service verticals. We capture reusable patterns in our platform layer without prematurely abstracting for unknown verticals.

---

## Engineering Philosophy

Yuva Minds engineering is guided by ten principles (detailed in [03-product-principles.md](./03-product-principles.md)):

1. Build for one customer.
2. Architect for many customers.
3. Prefer modular monolith over microservices.
4. AI-first development.
5. Documentation-first development.
6. Business-first architecture.
7. Clean Domain-Driven Design.
8. Strong module boundaries.
9. Production-ready from day one.
10. Enterprise coding standards.

These are not slogans. They are constraints that resolve trade-offs. When two options are equally viable technically, choose the one that aligns with these principles.

---

## Organizational Model (Engineering)

### Team Structure (Early Stage)

At founding stage, engineering operates as a **single product team** with clear ownership domains:

| Domain | Responsibility |
|--------|----------------|
| **Platform** | Auth, tenancy, billing, infrastructure, shared libraries |
| **Core Business** | CRM, leads, quotations, bookings, calendar |
| **Operations** | Tasks, staff, vendors, inventory |
| **Finance** | Invoicing, payments, expenses, reporting |
| **Growth** | Marketing, CMS, SEO, Instagram analytics |
| **Intelligence** | AI assistants, automation, BI, insights |

Module boundaries in code mirror these domains. A single engineer may own multiple domains early; the boundaries exist so ownership can split without rewrites.

### How We Make Decisions

1. **Document first** — Significant decisions are recorded in [12-architecture-decisions.md](./12-architecture-decisions.md) before implementation.
2. **Business context wins** — Engineers understand the event management domain ([04-business-domain.md](./04-business-domain.md)) before writing code.
3. **Boring technology** — We choose proven, well-documented tools. Innovation belongs in product and AI, not in infrastructure novelty.
4. **Reversibility** — Prefer decisions that are cheap to reverse. Flag irreversible decisions for explicit review.

---

## Relationship with We Decor Events

We Decor Events is the **first deployment**, not the **product definition**.

| We Decor Provides | We Decor Does Not Define |
|-------------------|--------------------------|
| Real workflows to validate | Hard-coded business rules in code |
| Feedback on UX and priorities | Custom one-off features without generalization |
| Production environment for dogfooding | Tenant-specific forks or branches |
| Domain expertise | Non-configurable data models |

Every feature built for We Decor must answer: *"How would this work for a 50-person event company in Mumbai, a 10-person company in Dubai, or a franchise with 5 locations?"* If the answer requires code changes per customer, the design is wrong.

Configuration, feature flags, and tenant settings replace customization.

---

## Success Metrics (Company Level)

### Phase 1: Validation (Single Tenant)

- We Decor runs daily operations on Event OS for core workflows (leads, quotes, bookings)
- Staff adoption: >80% of operational tasks happen in Event OS, not spreadsheets/WhatsApp
- Time-to-quote reduced measurably vs. previous process
- Zero data loss incidents; backups verified monthly

### Phase 2: Product-Market Fit (Multi-Tenant)

- 10+ paying event companies on the platform
- Net revenue retention > 100%
- Onboarding a new tenant without engineering involvement
- AI features used weekly by >50% of active users

### Phase 3: Scale

- Platform handles 100+ tenants with isolated data and configurable workflows
- API ecosystem for integrations (accounting, payment gateways, social platforms)
- Event OS recognized as category leader in event management software for SMBs

---

## Communication and Documentation Culture

### Documentation Is the Product Interface for Engineers

- If it is not documented, it does not exist.
- Documentation lives in `/docs` and is version-controlled alongside code.
- AI agents and new engineers onboard exclusively from documentation for the first week.

### Code Review Standards

- Every pull request references the module it affects and the business capability it enables.
- Architecture changes require an ADR update.
- No "drive-by" refactors outside the PR scope.

### Incident Response

- Production incidents are logged, post-mortemed, and result in documentation or code fixes.
- Blameless culture: systems fail, people learn.

---

## Legal and Compliance Posture (Early)

Event OS will handle:

- **Personal data** — Client names, phone numbers, emails, event details
- **Financial data** — Invoices, payments, tax information
- **Business communications** — WhatsApp messages, emails

From day one we design for:

- Data residency awareness (tenant-configurable region in multi-tenant phase)
- GDPR-ready data export and deletion
- Audit logging for sensitive operations
- Encryption at rest and in transit

Detailed security requirements are in [14-security-principles.md](./14-security-principles.md).

---

## Related Documents

| Document | Topic |
|----------|-------|
| [02-product-vision.md](./02-product-vision.md) | Event OS product vision and capabilities |
| [03-product-principles.md](./03-product-principles.md) | Engineering principles in depth |
| [11-roadmap.md](./11-roadmap.md) | Phased delivery plan |
| [12-architecture-decisions.md](./12-architecture-decisions.md) | Recorded technical decisions |

---

*Last updated: 2026-07-06*
*Owner: Founding Engineering*
