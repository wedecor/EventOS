# Glossary

## Purpose of This Document

This glossary defines all domain terms, technical terms, and acronyms used in Event OS documentation and code. Consistent terminology prevents miscommunication between engineers, product stakeholders, and AI agents.

Terms are organized alphabetically. Domain terms marked with **[D]** are defined in depth in [04-business-domain.md](./04-business-domain.md).

---

## A

**Aggregate [D]**
A cluster of domain objects treated as a single unit for data changes. Each aggregate has a root entity that controls access to entities within the boundary. Example: `Quotation` is the aggregate root for `QuoteLineItem` entities.

**Aggregate Root [D]**
The entity within an aggregate that serves as the entry point for all modifications. External references point only to the aggregate root, never to internal entities. Example: `Booking` is the aggregate root; other modules reference `bookingId`, not internal booking details.

**AI Assistant**
The Event OS module providing context-aware AI capabilities across workflows—quote generation, message drafting, scheduling suggestions, and general business questions.

**AI Suggestion**
A proposed AI output (quote line items, drafted message, schedule recommendation) presented to a user for review before acceptance or rejection. Never silently applied.

**Allocation [D]**
The reservation of inventory items for a specific event and date range. An allocation reduces available quantity until returned or cancelled.

**API (Application Programming Interface)**
The REST interface through which the frontend and external integrations communicate with the Event OS backend.

**Application Service**
A layer in the DDD architecture that orchestrates use cases by coordinating domain objects and infrastructure. Contains no business rules itself. Example: `LeadService.create()`.

**ADR (Architecture Decision Record)**
A documented record of a significant technical decision, including context, options, decision, and rationale. See [12-architecture-decisions.md](./12-architecture-decisions.md).

**Audit Log**
A chronological record of significant system actions (who did what, when) stored for compliance and debugging. Immutable once written.

---

## B

**BI (Business Intelligence)**
The Event OS module providing dashboards, KPIs, and analytical visualizations for business decision-making.

**Booking [D]**
A confirmed agreement to deliver an event, created from an approved quotation. The central entity connecting operations (tasks, staff, inventory) to finance (invoices).

**Booking Number**
A human-readable, tenant-sequential identifier for a booking (e.g., "BK-2026-0015"). Separate from the internal UUID.

**Bounded Context**
A DDD concept defining the boundary within which a domain model is defined and applicable. Each Event OS module corresponds to one bounded context. Example: the Lead context defines what "qualified" means for leads; this may differ from how other systems define qualification.

---

## C

**Calendar Entry [D]**
A schedulable time block in the unified calendar—events, site visits, meetings, or blocked time. May be linked to a booking, lead, or stand-alone.

**Client [D]**
A person or organization that hires the tenant (event management company) to plan and deliver an event. Not to be confused with the tenant itself or a software API client.

**Client Portal**
A future external-facing interface where end clients (wedding couples, corporate event planners) can view quotations, approve bookings, and track event progress.

**CMS (Content Management System)**
The Event OS module for managing the tenant's public website content—pages, galleries, service descriptions.

**Command**
An object representing an intent to change system state. Commands are handled by application services. Example: `CreateLeadCommand`, `ApproveQuotationCommand`.

**Contact [D]**
An individual person associated with a client. A client may have multiple contacts (e.g., bride and groom for a wedding). One contact is designated as primary.

**CRM (Customer Relationship Management)**
The Event OS module for managing clients, contacts, and interaction history.

---

## D

**DDD (Domain-Driven Design)**
A software design approach that centers development on the business domain, using a rich domain model, bounded contexts, and ubiquitous language. See [03-product-principles.md](./03-product-principles.md).

**Domain Event**
A record of something significant that happened in the domain. Past tense naming: `LeadCreated`, `QuotationApproved`, `BookingCancelled`. Used for cross-module communication.

**Domain Layer**
The innermost layer of the architecture containing business logic—entities, value objects, domain services, and repository interfaces. Has zero dependencies on infrastructure or frameworks.

**DTO (Data Transfer Object)**
A simple object for transferring data between layers or across API boundaries. Contains no business logic. Example: `LeadDto` returned by the API.

---

## E

**Entity**
A domain object with a unique identity that persists over time. Identified by ID, not by attribute values. Example: `Lead`, `Client`, `Booking`.

**Event [D]**
The actual occasion being managed—a wedding, corporate gala, birthday celebration. In Event OS, event details are embedded within a Booking. Not to be confused with a domain event or calendar entry.

**Event OS**
The AI-powered business operating system for event management companies, built by Yuva Minds.

**Event Template**
A tenant-configurable template defining default tasks, quotation line items, staff roles, and inventory items for a specific event type (e.g., "Wedding", "Corporate Conference").

**Expense [D]**
Money paid by the tenant for event delivery or operations—vendor payments, staff costs, consumables. Distinct from client payments received.

---

## F

**Feature Flag**
A tenant-level configuration toggle enabling or disabling specific Event OS capabilities. Allows gradual rollout and per-tenant customization without code changes.

**Finance Module**
The Event OS module handling invoicing, payments, expenses, and financial reporting.

---

## G

**Guardrail (AI)**
A validation and safety mechanism ensuring AI outputs meet schema requirements, content policies, and business rules before presentation to users.

---

## I

**Infrastructure Layer**
The outermost layer implementing technical concerns—database access, external API calls, file storage, email delivery. Implements interfaces defined in the domain layer.

**Inventory Item [D]**
A physical asset tracked by the tenant—decorative backdrops, furniture, lighting equipment, consumables. Distinct from a quote line item (which is a service/product on a quotation).

**Invoice [D]**
A formal bill for payment issued to a client, typically generated from a booking. Distinct from a quotation (which is a proposal, not a bill).

---

## J

**JWT (JSON Web Token)**
A compact, URL-safe token format used for API authentication. Event OS uses short-lived JWT access tokens with refresh token rotation.

---

## L

**Lead [D]**
A potential client inquiry that has not yet been qualified or quoted. Leads progress through pipeline stages from `new` to `won` or `lost`.

**Lead Scoring**
An AI-powered assessment of a lead's likelihood to convert, based on source, engagement, event type, budget, and historical patterns.

**Line Item**
An individual priced row on a quotation or invoice. Contains description, quantity, unit price, and total.

---

## M

**Modular Monolith**
An architectural pattern where the application is deployed as a single unit but internally organized into well-bounded, independently developable modules. Event OS's chosen architecture.

**Money (Value Object)**
A value object combining `amount` (decimal) and `currency` (ISO 4217 code). All financial calculations use Money, never raw floats.

**MVP (Minimum Viable Product)**
Phase 1 of Event OS: the minimum set of features for We Decor to run core daily operations. See [11-roadmap.md](./11-roadmap.md).

**Multi-Tenancy**
An architecture where a single Event OS deployment serves multiple event management companies (tenants) with isolated data and configurable settings.

---

## O

**Opportunity**
A qualified lead with estimated value and conversion probability. In Event OS, the lead pipeline serves this function; a separate Opportunity entity may be introduced if sales complexity warrants it.

**Outbox Pattern**
A reliability pattern where domain events are written to an `outbox` table within the same database transaction, then processed by a background worker. Ensures at-least-once event delivery.

---

## P

**Package [D]**
A pre-defined bundle of services and items offered at a set price by the tenant. Used to accelerate quotation creation. Example: "Premium Wedding Package" includes decor, lighting, and coordination.

**Payment [D]**
Money received from a client against an invoice. Recorded with amount, method, date, and reference number.

**Permission**
A granular access control grant. Format: `{resource}:{action}`. Example: `leads:write`, `quotations:approve`, `finance:read`.

**Pipeline**
The visual representation of leads organized by stage. The primary sales management view in Event OS.

**Platform Module**
A cross-cutting module providing infrastructure services used by all business modules: Auth, Tenant, Notification, File.

**Prompt Template**
A versioned AI instruction template with system and user message patterns, variable placeholders, and expected response schema. See [09-ai-development-guide.md](./09-ai-development-guide.md).

**PWA (Progressive Web App)**
A web application with mobile-like capabilities (installable, offline-capable) without requiring a native app store distribution.

---

## Q

**Quotation [D]**
A formal price proposal sent to a client for an event. Contains line items, pricing, terms, and validity period. Distinct from an invoice.

**Quotation Number**
A human-readable, tenant-sequential identifier for a quotation (e.g., "QT-2026-0042"). Separate from the internal UUID.

**Query**
An object representing a request for data without side effects. Handled by application services. Example: `SearchLeadsQuery`, `GetPipelineQuery`.

---

## R

**RBAC (Role-Based Access Control)**
The authorization model where users are assigned roles, and roles are granted permissions. Event OS uses RBAC with granular permissions.

**Repository**
A DDD pattern defining an interface for aggregate persistence. The domain layer defines the interface; the infrastructure layer implements it. Example: `LeadRepository` interface in domain, `PrismaLeadRepository` in infrastructure.

**RLS (Row-Level Security)**
A PostgreSQL feature enforcing data access policies at the database level. Used as defense-in-depth for tenant isolation in Phase 2.

---

## S

**SaaS (Software as a Service)**
The long-term delivery model for Event OS: multiple tenants using a shared, cloud-hosted platform with subscription pricing.

**Shared Kernel**
The small set of domain concepts, value objects, and types shared across bounded contexts. In Event OS: Money, DateRange, PhoneNumber, Email, Address, TenantContext.

**Site Visit**
An in-person meeting at the event venue or client location to assess requirements. Scheduled as a calendar entry and tracked as a lead pipeline stage.

**Staff [D]**
An employee or contractor of the tenant (event management company). Distinct from vendor (external supplier) and client (customer).

**Stage (Lead)**
A position in the lead pipeline representing progress toward conversion. Stages: `new` → `contacted` → `qualified` → `site_visit_scheduled` → `site_visit_completed` → `quoted` → `won` | `lost`.

---

## T

**Task [D]**
A unit of work with a title, assignee, due date, and status. Tasks are linked to bookings and may be generated from event templates.

**Tenant**
An event management company using Event OS. The top-level organizational unit for data isolation. We Decor Events is the first tenant.

**Tenant Context**
A request-scoped object containing the resolved tenant ID, settings, user identity, role, and permissions. Available to all application services.

**Tenant Settings**
JSONB configuration stored per tenant: branding, tax rules, numbering formats, pipeline stages, feature flags, integration credentials.

---

## U

**Ubiquitous Language**
The shared vocabulary between developers and business stakeholders defined in [04-business-domain.md](./04-business-domain.md). All code, documentation, and UI labels use these terms consistently.

**Use Case**
A specific business operation the system supports. Implemented as a method on an application service. Example: "Create lead", "Approve quotation", "Record payment".

**UUID (Universally Unique Identifier)**
The primary key format for all Event OS entities. Version 4 (random). Provides global uniqueness without coordination.

---

## V

**Value Object**
A domain object defined by its attributes rather than identity. Immutable. Examples: Money, DateRange, PhoneNumber, Email, Address, Venue.

**Vendor [D]**
An external supplier providing goods or services to the tenant—caterers, florists, photographers, rental companies. Distinct from staff (internal).

**Venue [D]**
The physical location where an event takes place. A value object containing name, address, capacity, and notes.

---

## W

**We Decor Events**
The first customer and validation partner for Event OS. An event management company whose daily operations drive Phase 1 development.

**WhatsApp Automation**
The Event OS module integrating with WhatsApp Business API for automated client communication, lead capture, and status updates.

**Workflow**
A defined sequence of steps for a business process. In Event OS, workflows are implemented through lead pipeline stages, booking status transitions, and event templates—not a separate workflow engine (initially).

---

## Y

**Yuva Minds**
The company building Event OS. Mission: build AI-powered operating systems for service businesses.

---

## Acronyms Quick Reference

| Acronym | Full Form |
|---------|-----------|
| ADR | Architecture Decision Record |
| API | Application Programming Interface |
| BI | Business Intelligence |
| CMS | Content Management System |
| CRM | Customer Relationship Management |
| DDD | Domain-Driven Design |
| DTO | Data Transfer Object |
| GL | General Ledger |
| JWT | JSON Web Token |
| KPI | Key Performance Indicator |
| MVP | Minimum Viable Product |
| PWA | Progressive Web App |
| RBAC | Role-Based Access Control |
| RLS | Row-Level Security |
| RPO | Recovery Point Objective |
| RTO | Recovery Time Objective |
| SaaS | Software as a Service |
| SEO | Search Engine Optimization |
| SLA | Service Level Agreement |
| TTL | Time To Live |
| UAT | User Acceptance Testing |
| UI | User Interface |
| ULID | Universally Unique Lexicographically Sortable Identifier |
| UTM | Urchin Tracking Module |
| UUID | Universally Unique Identifier |
| XSS | Cross-Site Scripting |

---

## Related Documents

| Document | Topic |
|----------|-------|
| [04-business-domain.md](./04-business-domain.md) | Full domain model with terms marked [D] |
| [06-module-design.md](./06-module-design.md) | Module names and responsibilities |
| [12-architecture-decisions.md](./12-architecture-decisions.md) | Technical acronyms in context |

---

*Last updated: 2026-07-06*
*Owner: Product & Engineering*
