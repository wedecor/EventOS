# We Decor Events — Business Model

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Approved |
| **Version** | 1.2 |
| **Created Date** | 2026-07-07 |
| **Last Updated** | 2026-07-07 |
| **Next Review Date** | 2027-01-07 |
| **Document Purpose** | Define how We Decor Events operates as a commercial business—revenue, acquisition, sales, pricing, costs, cash flow, risks, and growth—based on founder interviews. This is the authoritative reference for business economics and operational engine design. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas (Founder interview) | Initial interview capture across revenue, acquisition, sales funnel, pricing, cost structure, and cash flow |
| 1.0 | 2026-07-07 | Yuva Minds (Editorial review) | **Approved.** Full document produced with business rules, key metrics, risks, software implications, consistency review against `01-business-vision.md`, and quality audit |
| 1.1 | 2026-07-07 | Yuva Minds (Editorial review) | **Approved.** Added Company DNA, Founder Responsibilities, Competitive Advantages, Decision-Making Principles, Technology Stack, North Star Metric, Key Business Principles; consistency and editorial review pass (no business fact changes) |
| 1.2 | 2026-07-07 | Yuva Minds (Controlled revision) | Staffing model corrected to align with `06-staff-management.md` v1.0. Factual headcount references only; no policy or rule changes. |

---

## Purpose of This Document

This document describes **how We Decor Events works as a business today**—how money is earned, how customers are acquired, how enquiries convert to bookings, how quotations are priced, how costs and cash flow operate, and where the business is headed.

It is derived from direct founder interviews (July 2026–July 2027). Facts are distinguished from future vision. Metrics that are not tracked are explicitly marked **Not Currently Measured**—never estimated.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders who need to understand We Decor's commercial engine before building systems or making investment decisions.

**Source:** Founder interview (Ilyas), July 2026–July 2027  
**Status:** Version 1.1 — Approved (Document 02 of 20)

**Prerequisite:** [01-business-vision.md](./01-business-vision.md)

---

## Executive Summary

We Decor Events is a **volume-driven, home-celebration-focused decoration business** operating in Bangalore. In a typical month, the company completes **15–20 events**, generates approximately **₹1.5 lakh to ₹2.5 lakh** in revenue (up to **~₹3 lakh** in peak months), and maintains an average booking value of approximately **₹10,000** (range: **₹5,000–₹52,000** over the last six months).

Revenue is concentrated in **Haldi decorations (~60% of revenue)**, followed by engagements, birthdays, and other home celebrations. The business does not depend on a few large events—revenue comes from many small and medium bookings.

**Customer acquisition** is heavily dependent on **Instagram Ads (~80% of enquiries)**, with the remainder from website, referrals, repeat customers, and direct WhatsApp. Approximately **200 enquiries per month** arrive when Instagram Ads are active; volume drops significantly when ads are paused (exact volume without ads: **Not Currently Measured**). Overall enquiry-to-booking conversion is approximately **10%**.

**Sales** follow a defined pipeline in the Lead Management Application: **New → In Talks → Approved → Completed**, with exit statuses for lost and cancelled opportunities. Bookings are confirmed only when **~20% advance payment** is received. Quotations are prepared entirely by **Zakir**, based on experience and a mental cost model—not a formula or automated pricing engine.

**Financial tracking is immature by design today.** We Decor evaluates performance at the monthly business level, not at the event level. Profit margins, customer acquisition cost, return on ad spend, and monthly operating burn are **Not Currently Measured**. The founders prioritize delivery quality and customer trust over financial optimization— including absorbing material cost increases after booking confirmation rather than renegotiating with customers.

**Long-term customer strategy** is foundational: We Decor does not view a booking as a one-time transaction. The goal is to become each family's **trusted celebration partner for life**, proactively reconnecting around future milestones (birthdays, anniversaries, engagements, weddings, and family celebrations).

**Growth strategy:** Continue strengthening the **home celebration segment** while gradually expanding into **complete event management services**—not abandoning decoration expertise, but layering planning, vendor coordination, and end-to-end execution over time.

*For strategic context, founder roles, competitive positioning, decision principles, and technology stack, see sections immediately below. For full business rules, see [Business Rules](#business-rules).*

---

## Company DNA

*Synthesized from founder interviews and [01-business-vision.md](./01-business-vision.md). No new business facts introduced.*

### Mission

> **Make sure every customer leaves with a smile.**

We Decor exists to make celebrating life's special moments beautiful, memorable, and stress-free—without requiring customers to spend months planning every detail.

### Vision

- Become each family's **trusted celebration partner for life**
- Become a **household name for home event decorations** in Bangalore
- **Continue strengthening the home celebration segment** while gradually expanding into **complete event management services**
- Remove operational complexity through technology so the team can focus on creativity, relationships, and delivering exceptional events

### Business Philosophy

- **Customer trust over short-term profit** — Honor agreed quotations even when material costs rise; absorb losses rather than renegotiate after booking confirmation
- **Quality over shortcuts** — One poorly executed event can damage years of trust; deliver committed designs as promised
- **Honest pricing** — No hidden charges after booking; fair value from the start rather than competing solely on lowest price
- **Long-term customer relationships over one-time transactions** — Remember milestones; proactively reconnect before future celebrations
- **Personalized celebrations** — Every event is fully customized; no fixed packages; adjust scope—not price—when customers negotiate

### Core Values

*Full values defined in [01-business-vision.md](./01-business-vision.md). Summary:*

| Value | Essence |
|-------|---------|
| Customer Trust Before Profit | Honor commitments after booking confirmation |
| Every Event Matters | Equal care regardless of event size or budget |
| Deliver What We Promise | Execute committed designs as promised |
| Quality Without Compromise | Execution quality is non-negotiable |
| Continuous Improvement | Solve operational problems through process and technology |
| Technology as a Competitive Advantage | Internal systems improve speed, accuracy, and scale |
| Professionalism | Reliable communication, on-time setup, skilled execution |
| Transparency | No hidden charges; additional costs only for scope changes |

### Brand Promise

> **We always deliver what we promise.**

Customers should describe We Decor as reliable, professional, easy to work with, delivering beautiful customized decorations at reasonable prices, and genuinely caring about making every celebration special.

### North Star Metric

> **Customers who leave with a smile after a successful celebration.**

*See [North Star Metric](#north-star-metric) for supporting metrics and measurement status.*

---

## Founder Responsibilities

Clear division of responsibilities between co-founders. All enquiries enter through Ilyas; all post-assignment customer and execution ownership sits with Zakir unless otherwise noted.

### Ilyas

| Area | Responsibilities |
|------|------------------|
| **Marketing** | Instagram Ads, campaign monitoring, lead generation strategy |
| **Website** | Website management and enquiry capture |
| **SEO** | Search engine optimization |
| **Instagram Ads** | Primary paid acquisition channel (~₹4,000–₹5,000/month) |
| **Lead Generation** | Driving enquiries through owned digital channels |
| **Technology** | Internal software direction and implementation |
| **Software** | Lead Management Application, Quotation and Billing Application, website infrastructure |
| **Business Growth** | Strategic growth, brand building, channel expansion (including planned Google Ads restart) |
| **Internal Systems** | Building and maintaining operational tools |
| **Lead Intake** | Receives every enquiry first; creates lead in Lead Management Application; assigns to Zakir |

### Zakir

| Area | Responsibilities |
|------|------------------|
| **Sales** | Manages enquiry from assignment through conversion or close |
| **Customer Communication** | Primary customer contact on WhatsApp |
| **Requirement Gathering** | Understands event requirements, budget, venue, design preferences |
| **Quotation Preparation** | All quotations prepared and sent by Zakir |
| **Material Procurement** | Purchases flowers, balloons, props, and decoration materials |
| **Vendor Coordination** | Coordinates with trusted vendors when required (including informal coordination for expanded service enquiries) |
| **Team Coordination** | Coordinates permanent decorators and trusted temporary decorator pool for events |
| **Event Execution** | Ensures events are planned, setup, and completed on time |
| **Customer Satisfaction** | Delivers hassle-free experience from booking through completion |
| **Pipeline Management** | Updates lead statuses (In Talks, Approved, Completed, exit statuses) |

---

## Why Customers Choose We Decor

*Competitive advantages supported by founder interviews and documented customer feedback. Not marketing claims without basis.*

| Advantage | Evidence / Basis |
|-----------|------------------|
| **Fully customized decorations** | No fixed packages; every quotation tailored to requirements and budget |
| **Fair, budget-friendly pricing** | Quality and customization at accessible price points (from ₹3,000 entry); not luxury-only |
| **Honest quotations** | No price increases after booking confirmation; no hidden charges |
| **Quality execution** | Non-negotiable execution standards; reputation built event by event |
| **Strong Google reviews** | 75+ five-star Google reviews |
| **Home celebration specialization** | Deliberate focus on Haldi, engagements, birthdays, baby showers, and similar home events (~60% revenue from Haldi) |
| **End-to-end customer support** | Single bundled price; post-booking, decoration handled entirely by We Decor |
| **Reliability and responsiveness** | Same-day contact after assignment; professional communication |
| **Delivering what was promised** | Trust won when customer sees completed decoration; core brand promise |
| **Creative and modern designs** | Design sharing during In Talks; customization including themes, flowers, props, neon signs |
| **Technology-enabled operations** | Internal systems support faster response and enquiry management (internal advantage; customers experience outcomes) |

### Why Deals Are Lost (Context)

| Reason | Frequency |
|--------|-----------|
| Customer chooses lowest-priced quotation without weighing quality or reliability | Most common |
| Date unavailable due to existing bookings | Occasional |

---

## Decision-Making Principles

*How founders resolve trade-offs when running the business. Derived from documented values, non-negotiables, and business rules.*

| Principle | In Practice |
|-----------|-------------|
| **Customer experience before profit** | Absorb material cost increases after confirmation rather than increase customer price |
| **Quality before speed** | Decline bookings that cannot be executed well; strengthen planning after punctuality incidents |
| **Trust before revenue** | Approved status only after advance payment verified—not verbal confirmation |
| **Long-term relationships before short-term gains** | Invest in repeat customers, referrals, and lifelong celebration partner vision |
| **Simplicity over unnecessary complexity** | Single bundled customer quotation; adjust scope rather than add fee categories |
| **Deliver before collecting balance** | Remaining payment usually after successful event completion |
| **Own channels before aggregators** | Website, Instagram, SEO, and referrals over third-party lead platforms |

---

## Key Business Principles

*One-page summary of rules that govern We Decor today. Full registry: [Business Rules](#business-rules) (BR-01–31).*

1. **We never increase the agreed quotation after booking confirmation.**
2. **We do not compromise on quality of execution.**
3. **We generally do not discount; we adjust scope and design instead of cutting price.**
4. **Every event is fully customized—no fixed packages.**
5. **Every customer is treated equally regardless of event size or budget.**
6. **We honor our commitments even at reduced profit or loss when material costs change after confirmation.**
7. **We decline events we cannot deliver well rather than accept and fail.**
8. **We do not use hidden charges; additional costs apply only when the customer requests scope changes.**
9. **Booking is confirmed only when advance payment (~20% of quotation) is received.**
10. **We believe remembering customer celebrations and milestones helps us serve customers better over time** — supporting the goal that every booking should become a lifelong relationship.
11. **Every operational challenge is an opportunity to improve through process and technology—not acceptance of chaos.**

---

## Current Business Technology Stack

*Every system currently used to operate the business. Integration gaps documented in [Software Implications](#software-implications).*

| System | Purpose | Primary User |
|--------|---------|--------------|
| **Lead Management Application** | Capture enquiries, track pipeline (New → In Talks → Approved → Completed), assign follow-up reminders, manage sales journey | Ilyas (intake), Zakir (pipeline) |
| **Quotation and Billing Application** | Generate quotations and invoices as PDFs; store quotation history; manage billing and payment records | Zakir |
| **Website** | Lead generation via enquiry forms, WhatsApp button, phone contact; SEO landing pages | Ilyas |
| **Instagram** | Portfolio display, organic enquiries via DMs, brand presence, post-event marketing photos/videos | Ilyas |
| **Instagram Ads** | Primary paid lead generation (~80% of enquiries); campaign management via Instagram Ads Manager | Ilyas |
| **WhatsApp** | Primary customer communication, design sharing, quotation delivery, payment confirmations, internal coordination | Zakir (primary); founders and team |
| **Google Business Profile** | Local discovery and review presence (75+ five-star Google reviews documented) | Ilyas |

**Not currently active:** Google Ads (used in past; restart planned). JustDial (no longer used).

**Key gap:** Lead Management Application and Quotation and Billing Application are **not integrated**. Lead source tracking is **manual**. Marketing attribution from ad to revenue is **Not Currently Measured**.

---

## North Star Metric

### Primary North Star

> **Customers who leave with a smile after a successful celebration.**

This is the ultimate measure of success—not quotation volume, enquiry count, or revenue alone. Trust is confirmed when the customer sees the completed decoration for the first time. An event succeeds when the customer enjoys their celebration without worrying about the decoration process.

### Supporting Metrics

| Metric | Role | Measurement Status |
|--------|------|-------------------|
| **Customer satisfaction** | Immediate reaction at event completion; reviews and feedback | Qualitative today; not formally surveyed |
| **Repeat customers** | Evidence of lifelong relationship strategy | Growing source; rate **Not Currently Measured** |
| **Referrals** | Word-of-mouth from satisfied customers | Significant/growing source; rate **Not Currently Measured** |
| **Google reviews** | Public trust signal | 75+ five-star reviews (known) |
| **Successful event completion** | Events moved to Completed status; on-time setup | Tracked in Lead Management Application at booking level; punctuality not systematically measured |

### What the North Star Is Not

- **Not** enquiry volume alone (~200/month when ads active)
- **Not** conversion rate alone (~10%)
- **Not** monthly revenue alone (₹1.5–2.5 lakh typical)

These are operational and financial indicators. The North Star is customer outcome at the moment of celebration.

---

## Revenue Model

### Current Revenue (Today)

| Attribute | Detail |
|-----------|--------|
| **Primary revenue source** | Event decoration services (almost entirely) |
| **Pricing model** | Fully customized quotations; no fixed packages |
| **Customer-facing price** | Single bundled price including materials, labour, transportation, and execution |
| **Separate fees** | None—no coordination fees, design fees, or service charges billed separately |
| **Non-revenue activities** | No rental business; no vendor commissions or markups |
| **GST** | Not GST registered; quotations do not include GST |

### Revenue Volume

| Metric | Value |
|--------|-------|
| Typical monthly revenue | ₹1.5 lakh – ₹2.5 lakh |
| Peak monthly revenue | Up to ~₹3 lakh |
| Typical events per month | 15–20 |
| Peak events per month | Up to ~25 (per `01-business-vision.md`) |
| Average booking value | ~₹10,000 |
| Smallest booking (last 6 months) | ~₹5,000 |
| Largest booking (last 6 months) | ~₹52,000 |

### Revenue by Event Type (Approximate)

*Figures vary month to month. Not formally audited.*

| Event Type | ~% of Revenue | ~% of Events | Typical Value Range |
|------------|---------------|--------------|---------------------|
| Haldi Decorations | ~60% | ~45–50% | ₹8,000 – ₹30,000+ |
| Engagement Decorations | ~15% | ~15% | ₹8,000 – ₹25,000+ |
| Birthday Decorations | ~10% | ~20% | ₹5,000 – ₹15,000+ |
| Baby Shower Decorations | ~5% | ~5% | ₹8,000 – ₹20,000+ |
| Wedding Decorations | ~5% | ~5% | ₹20,000 – ₹52,000+ |
| Other (Anniversary, Mehndi, Nikah, Proposal, etc.) | ~5% | ~10% | Varies |

**Key insight:** Haldi generates the largest share of revenue because of high demand and higher average booking values relative to smaller celebrations.

### Revenue Concentration

- Revenue is **not** dependent on a few large events.
- The business is driven by **many small and medium bookings**, creating relatively stable monthly revenue compared to a wedding-only model.
- Typical month: mix of birthdays, Haldi, engagements, baby showers, anniversaries, and occasional weddings or larger events.

### Future Revenue (Vision — Not Current)

We Decor plans to evolve into a **full-fledged event management company** while keeping decoration as core expertise. Future services may include:

- Complete event planning and coordination
- Vendor management
- Venue decoration and event setup (existing)
- Photography and videography coordination through trusted partners
- Entertainment and artist coordination
- Catering coordination through partner vendors
- Invitation and event stationery coordination
- Return gifts and event accessories
- End-to-end event execution

**Pricing approach (future):** Initially bundled into a single customized quotation; separate pricing for specific services may emerge as the business matures. Timeline is **demand-driven**, not fixed—some services within 1–2 years, others as the business grows.

**Demand signal:** Customers already enquire about complete event management beyond decoration. We Decor has coordinated informally with trusted vendors or explained decoration-only specialization.

---

## Business Economics

### Unit Economics (Known)

| Metric | Value | Status |
|--------|-------|--------|
| Average booking value | ~₹10,000 | Known (approximate) |
| Advance payment | ~20% of quotation | Standard practice (exceptions case-by-case) |
| Enquiry → booking conversion | ~10% | Known (approximate; varies by season) |
| Enquiries per month (ads active) | ~200 (all channels) | Known (approximate) |
| Instagram Ads share of enquiries | ~80% | Known (approximate) |
| Instagram Ads monthly spend | ₹4,000 – ₹5,000 | Known |
| Events per month | 15–20 typical | Known (approximate) |

### Unit Economics (Not Currently Measured)

| Metric | Status |
|--------|--------|
| Cost per lead (Instagram Ads Manager only; not integrated with Lead Management Application) | Partially tracked externally |
| Cost per booking | Not Currently Measured |
| Customer acquisition cost (CAC) | Not Currently Measured |
| Return on ad spend (ROAS) | Not Currently Measured |
| Event-level profit and loss | Not Currently Measured |
| Event-level margin by type | Not Currently Measured |
| Monthly operating burn | Not Currently Measured |
| Profitability of referrals vs cold enquiries | Not Currently Measured |
| Channel-specific conversion rates | Not Currently Measured |
| Enquiry volume without active Instagram Ads | Not Currently Measured |

### Economic Model Summary

```
Revenue = (Enquiries × Conversion Rate × Average Booking Value)
        ≈ (200 × 10% × ₹10,000) = ~₹2,00,000/month (theoretical mid-point; aligns with stated range)

Costs = Materials + Labour + Transportation + Marketing + Storage + Software + Misc
      → Not tracked at event level; monthly evaluation is experiential, not analytical
```

---

## Customer Acquisition

### Lead Sources (Current)

| Channel | How Enquiry Arrives | First Handler | ~% of Enquiries |
|---------|---------------------|---------------|-----------------|
| **Instagram Ads** | Customer sees promoted post/reel; sends Instagram DM | Ilyas | ~80% |
| **Website** | Enquiry form or WhatsApp button on website | Ilyas | ~20% (includes SEO/organic Google) |
| **Instagram (Organic)** | Customer discovers posts/reels; sends DM | Ilyas | Small percentage (not separately quantified) |
| **Referrals** | Existing customer recommendation; contacts via WhatsApp or website | Ilyas | Growing source (exact % Not Currently Measured) |
| **Repeat Customers** | Previous customer contacts via WhatsApp for new celebration | Ilyas | Growing source (exact % Not Currently Measured) |
| **WhatsApp Direct** | Customer with saved number contacts directly | Ilyas | Small percentage |
| **Google Ads** | Not currently active | N/A | 0% (used in past; restart planned) |
| **JustDial** | No longer used | N/A | Negligible |

**Universal intake rule:** Regardless of source, **Ilyas** receives every enquiry first, collects basic details (event type, date, location, WhatsApp number), creates a lead in the **Lead Management Application**, and assigns to **Zakir**.

### Marketing Strategy

| Attribute | Detail |
|-----------|--------|
| Primary channel | Instagram Ads |
| Monthly ad spend | ~₹4,000 – ₹5,000 |
| Campaign approach | Generally one campaign at a time; often Haldi-focused (attracts other home celebration enquiries too) |
| Ad activity | Run throughout the year |
| Peak season scaling | Do not significantly increase spend during peak seasons today; plan to optimize in future |
| Google Ads | Inactive; restart is a marketing priority alongside website/SEO improvement |
| Instagram focus rationale | Currently the primary source of new enquiries and the most effective marketing channel for the business |

### Marketing Performance Tracking

| What Is Tracked | What Is Not Tracked |
|-----------------|---------------------|
| Enquiry count from Instagram campaigns (Instagram Ads Manager) | End-to-end: Ad → Lead → Quotation → Booking → Revenue |
| Cost per lead (CPL) in Instagram Ads Manager | Cost per booking |
| | CAC, ROAS |
| | Channel-specific conversion |
| | Lead source in Lead Management Application (manual identification only) |

### Seasonality

| Pattern | Detail |
|---------|--------|
| Higher demand | Wedding season; festive periods (more Haldi, engagements, weddings) |
| Steady demand | Birthdays, baby showers, anniversaries throughout the year |
| Ad spend seasonality | Relatively flat year-round today (~₹4–5k/month) |

### Acquisition Intake Process

```
Customer sees ad / website / referral
    → Contacts We Decor (Instagram DM, WhatsApp, website form)
    → Ilyas collects: event type, date, location, WhatsApp number
    → Lead created in Lead Management Application (status: New)
    → Assigned to Zakir
    → Zakir contacts customer (typically same day) on WhatsApp
```

---

## Sales Funnel

### Pipeline Statuses (Lead Management Application — Current)

| Status | Trigger | Updated By | What Happens Next |
|--------|---------|------------|-------------------|
| **New** | Enquiry created with basic details | Ilyas | Assigned to Zakir |
| **In Talks** | Zakir begins communication; requirements, designs, quotation, follow-up | Zakir | Customer evaluates; remains here until advance paid or closed |
| **Approved** | Customer pays advance (~20% of quotation) | Zakir | Event scheduled; preparation begins |
| **Completed** | Event successfully executed | Zakir | Balance collected if pending; photos/videos for marketing |
| **Not Interested** | Customer explicitly declines | Zakir | Enquiry closed |
| **Closed / Lost** | No response, chose another decorator, or inactive after follow-ups | Zakir | No further follow-up |
| **Cancelled** | Customer cancels after Approved (advance received) | Zakir | Refund handled per cancellation policy |

### Exit Status Definitions

| Status | When Used |
|--------|-----------|
| **Not Interested** | Customer explicitly says they will not proceed (postponed, changed plans, no longer interested) |
| **Closed / Lost** | No final answer; customer stopped responding; chose another decorator; inactive after multiple follow-ups |
| **Cancelled** | Booking was Approved (advance paid) and customer later cancels |

### Sales Process Detail

**In Talks includes:** Requirement gathering, design sharing, quotation preparation and sharing, negotiation (scope adjustment), follow-up. Quotation details are recorded in the Lead Management Application during this stage.

**Communication channel:** Primarily **WhatsApp**. Instagram DM enquiries move to WhatsApp after collecting the customer's WhatsApp number.

**First contact:** Zakir typically contacts on the **same day** after assignment. Initial details already collected by Ilyas—customer not asked to repeat.

**Follow-up:** Manual reminder dates set in Lead Management Application by Zakir based on expected decision timeline. No fixed number of follow-ups. Application reminds when follow-up is due.

**Booking confirmation rule:** **Approved = advance payment received.** Verbal confirmation or WhatsApp message alone does **not** confirm a booking.

**Typical sales cycle:** 2–3 days from quotation to advance payment for most home celebrations (Haldi, birthdays, engagements, baby showers). Varies by customer and event date. Average sales cycle by event type: **Not Currently Measured**.

**Lost reasons:** **Not captured** in structured form. Planned improvement.

### Conversion

| Metric | Value |
|--------|-------|
| Overall enquiry → booking | ~10% (varies by season, competition, lead quality) |
| Referrals and repeat customers → booking | Believed higher than cold enquiries; **Not Currently Measured** |
| Channel-specific conversion | Not Currently Measured |

### Payment Terms (Sales Close)

| Stage | Practice |
|-------|----------|
| Advance | ~20% of total quotation (standard; exceptions case-by-case) |
| Balance | Usually collected **after successful event completion** |
| Payment methods | UPI, Bank Transfer, Cash (no card payments) |
| Payment confirmation | UPI/bank notification via WhatsApp; cash manually acknowledged |
| Approved trigger | Payment verified → status set to Approved |

### Quotation Data Split

| System | Responsibility |
|--------|----------------|
| **Lead Management Application** | Sales pipeline, customer journey, quotation details during In Talks |
| **Quotation and Billing Application** | Finalized quotations, billing, invoices, payment records |

**Integration status:** Systems are **not integrated**. Information does not flow automatically between them.

---

## Pricing Strategy

### Quotation Ownership

- **All quotations prepared by Zakir**
- Responsibilities: understand requirements, suggest designs, estimate cost, share quotation

### Information Required Before Quoting

- Event type, date, location
- Selected decoration design
- Balloons, flowers, or combination
- Fresh or artificial flowers
- Name board / welcome board requirements
- Neon sign requirements
- Additional items: entrance decoration, floor decoration, cake table, LED lights, customized props, special requests

**Site visit:** Generally **not required** for home celebrations. Photos, videos, and discussions usually sufficient.

### Pricing Method

Pricing follows an **internal mental model**—not a stored formula:

| Factor Considered | Stored in Application? |
|-------------------|------------------------|
| Selected design | Notes only |
| Materials (flowers, balloons, boards, props) | Not broken down |
| Labour for setup and execution | Not broken down |
| Transportation / venue distance | Not broken down |
| Design complexity | Judgment |
| Similar past events (experience + historical quotes) | Referenced when useful |
| Customer budget | Discussed during In Talks | 

**Customer receives:** Single customized price—not a material, labour, transportation, or margin breakdown.

### Discounts and Negotiation

| Practice | Detail |
|----------|--------|
| Discounts | Generally not offered; fair value from the start |
| Negotiation | Customers sometimes negotiate; response is to **adjust design/scope**, not reduce price directly |
| Approval hierarchy | None; Zakir has full authority to prepare and send quotations |
| Margin targets | None predefined; margin **Not Currently Measured** |

### Quotation Administration

| Attribute | Detail |
|-----------|--------|
| GST | Not applicable (not GST registered) |
| Validity period | No formal expiry; open until customer decides (may revise if material costs shift significantly pre-booking) |
| Revisions | Existing quotation **updated** as requirements evolve—not a new document each time |
| Historical reference | Zakir uses experience; can refer to past quotations in Quotation and Billing Application for similar events |

### Example: Typical Haldi Quotation

Customer selects preferred design → Zakir evaluates backdrop, flowers, balloons, welcome board, name board, custom requests → considers venue location and transportation → prepares customized quotation → revises if customer requests changes → agreement on final design and price → advance payment → Approved.

---

## Cost Structure

### Cost Categories

| Cost Category | Typical Cost | When Paid | Managed By |
|---------------|--------------|-----------|------------|
| **Materials** (flowers, balloons, props, boards) | Varies by event and design | After booking confirmed; before event (flowers close to event date) | Zakir |
| **Labour** (decorators, setup) | Salaries for 2 permanent decorators; temporary decorator daily wages when engaged | Monthly / per event | Zakir |
| **Transportation** | Depends on venue location and material volume | Event day or after | Zakir |
| **Marketing** (Instagram Ads) | ~₹4,000 – ₹5,000/month | Monthly | Ilyas |
| **Storage** | Minimal today; dedicated facility planned | Monthly | Ilyas & Zakir |
| **Software** | Lead Management Application, Quotation and Billing Application, website, domain, hosting, tools | Monthly / yearly | Ilyas |
| **Other** | Phone, internet, equipment, maintenance, misc | As required | Ilyas & Zakir |
| **Founder drawings** | Not fixed salaries; drawn based on business requirements | As needed | Ilyas & Zakir |

### Cost Tracking Maturity

| Level | Status |
|-------|--------|
| Event-level cost tracking | Not Currently Measured |
| Event-level profit/loss | Not Currently Measured |
| Monthly operating burn | Not Currently Calculated |
| Salary totals (permanent decorators) | Not Formally Tracked in this document |
| Transportation per event | Not Separately Tracked |
| Material cost as % of quotation | Not Currently Measured |

### Material Purchasing

- Purchased primarily by **Zakir**
- Method depends on event and vendor (cash at local markets when necessary)
- Fresh flowers purchased close to event date
- Artificial materials reused when possible

### Labour Model

- **2 permanent decorators**
- **Trusted temporary decorator pool** engaged when workload or complexity requires
- Founder labour: Ilyas (growth, technology, marketing); Zakir (operations, customer, execution)

---

## Cash Flow

### Cash Flow Model

```
IN:  ~20% advance at booking confirmation (Approved)
     Remaining balance after event completion (Completed)

OUT: Materials after booking confirmed, before event
     Fresh flowers very close to event date
     Salaries monthly
     Marketing monthly
     Software/subscriptions monthly or annual
     Miscellaneous as required
```

### Working Capital

- Advance payment generally sufficient to begin event preparation
- Some business working capital still required for smooth operations
- **No significant cash flow crises** reported that prevented event delivery

### Cash Flow Challenges (Known)

| Situation | Response |
|-----------|----------|
| Material costs (especially flowers) increase after quotation finalized and booking confirmed | Honor agreed price; absorb additional cost; complete at lower profit or loss |
| Balance collected after event | Customer satisfaction before final payment; customers generally honor this |
| Cash purchases for materials | Zakir uses cash at local markets when needed |

### Payment Mix

- Most payments: **UPI and bank transfer**
- Cash: accepted from customers; used for material purchases

### Not Currently Measured

- Outstanding balance receivables at any point in time
- Cash flow forecasting
- Monthly cash in vs cash out analysis

---

## Profitability

### Current State

We Decor **does not calculate exact profit or loss per event**. Business performance is evaluated at the **overall monthly level** through experience, not financial reports.

### Revenue Profitability Patterns (Qualitative — Not Measured)

| Observation | Basis |
|-------------|-------|
| Haldi contributes largest revenue share | ~60% of revenue; high demand + higher average values |
| Smaller events (birthdays) lower ticket but higher volume | ~20% of events, ~10% of revenue |
| Weddings higher ticket but less frequent | ~5% of events and revenue |
| Events completed at loss | Documented when flower/material prices spike post-confirmation |
| Referrals and repeat customers | Believed to have **higher conversion rates**; profitability **Not Currently Measured** |

### Pricing vs Profit Philosophy

- Quality delivery and customer trust prioritized over margin optimization
- Willing to sacrifice event-level profit to honor committed quotations
- Detailed margin analytics planned for future through integrated systems

---

## Operations

### Current Capacity

| Metric | Value |
|--------|-------|
| Founders | 2 (Ilyas, Zakir) |
| Permanent decorators | 2 |
| Temporary decorators | Trusted pool; engaged as needed |
| Typical events/month | 15–20 |
| Peak events/month | Up to ~25 |
| 12-month target | 30+ events/month at consistent quality |

### Current Bottlenecks

1. **High competition in Bangalore** — Customers contact multiple decorators; speed and follow-up determine conversion
2. **Managing multiple simultaneous events with a small team** — Especially during peak season and weekends
3. **Operational coordination across the city** — Events on same day spread across Bangalore; staff, materials, transportation, timing

*Note: Lead generation is generally **not** the primary bottleneck when Instagram Ads are active (~200 enquiries/month). Constraints are operational execution and coordination.*

### Resource Planning (Today)

| Resource | How Managed |
|----------|-------------|
| Staff assignment | Manual; experience-driven; **no centralized scheduling system** |
| Materials | Purchased by Zakir; distributed storage today; dedicated facility planned |
| Event scheduling | WhatsApp, phone calls, personal planning |
| Customer communication | WhatsApp (primary) |
| Cross-event visibility | **Not available** in a single system |

### Seasonality (Operations)

- Wedding season and festive periods: significantly busier
- Weekends and peak days: multiple same-day events common
- Home celebrations (birthdays, etc.): provide year-round baseline volume

---

## Long-Term Customer Strategy

*This is a core business philosophy—not a current operational capability.*

We Decor does **not** view a booking as a one-time transaction.

**Goal:** Build lifelong relationships with customers. Become the family's **trusted celebration partner for life**.

**Future growth mechanism:** Remember customer milestones—birthdays, anniversaries, engagements, weddings, and family celebrations—and **proactively reconnect** before each occasion.

**Implication:** The business model evolves from transactional decoration bookings to **relationship-driven, repeat-celebration revenue** over a customer's lifetime. This requires customer intelligence beyond a standard CRM: celebration history, preferences, family milestones, and proactive outreach.

*Current capability:* Repeat customers and referrals are a growing source; milestone tracking and proactive reconnection are **not systematically implemented today**.

---

## Business Risks

### Marketing Risks

| Risk | Detail | Severity |
|------|--------|----------|
| **Instagram Ads dependency** | ~80% of enquiries from paid Instagram; pausing ads significantly reduces volume | High |
| **No end-to-end attribution** | Cannot measure ad → booking → revenue; investment decisions partly intuitive | Medium |
| **Google Ads inactive** | Diversification channel not currently utilized | Medium |
| **CPL tracked but not connected to profit** | May optimize for enquiries, not profitable bookings | Medium |

### Competitive Risks

| Risk | Detail | Severity |
|------|--------|----------|
| **Price-only competition** | Most lost deals to lowest-priced quotation | High |
| **Multi-decorator shopping** | Customers contact several decorators before deciding | High |
| **Date unavailability** | Lose enquiries when dates already booked | Medium |

### Operational Risks

| Risk | Detail | Severity |
|------|--------|----------|
| **Same-day multi-event logistics** | Small team, events across Bangalore | High |
| **Last-minute customer changes** | Disrupt planning; affect other events | Medium |
| **Key-person dependency** | Zakir: quoting, customer, operations; Ilyas: intake, marketing, technology | High |
| **WhatsApp as system of record** | No structured audit trail for critical communications | Medium |
| **Disconnected applications** | Lead Management Application and Quotation and Billing Application not integrated | Medium |
| **Punctuality** | Past 30-minute late incident; planning strengthened but risk remains | Medium |

### Financial Risks

| Risk | Detail | Severity |
|------|--------|----------|
| **Material cost volatility** | Especially fresh flowers; absorbed post-booking confirmation | High |
| **No event-level margin visibility** | Cannot identify unprofitable event types or designs | Medium |
| **Balance after event** | Working capital exposure if volumes scale | Low–Medium (not reported as problem today) |
| **No formal monthly burn tracking** | Limited visibility into fixed cost coverage | Medium |

### Strategic Risks

| Risk | Detail | Severity |
|------|--------|----------|
| **Scaling without systems** | 30+ events/month target with manual coordination | High |
| **Event management expansion complexity** | New services require vendor partnerships and operational maturity | Medium (future) |

---

## Growth Strategy

### 12-Month Goals (from interviews)

| Goal | Target |
|------|--------|
| Zakir full-time on We Decor | Within 12 months |
| Event volume | Consistently 30+ events/month |
| Team | Expand permanent staff |
| Infrastructure | Dedicated storage and operations space |
| Marketing | Increase Instagram Ads and Google Ads investment |
| Brand | Strengthen home celebration search presence |
| Systems | Integrated internal operational systems |
| Services | Decoration remains core; progress toward event management |

### Strategic Direction

1. **Continue strengthening the home celebration segment** — Haldi, engagements, birthdays, baby showers, anniversaries, Mehndi, Nikah, and similar
2. **Gradually expand into complete event management services** — Planning, vendor coordination, end-to-end execution; demand-driven timeline
3. **Build lifelong customer relationships** — Milestone memory and proactive reconnection (see Long-Term Customer Strategy)
4. **Improve marketing analytics** — End-to-end attribution from advertisement to revenue
5. **Introduce financial analytics** — Event-level profitability, margins, burn rate, CAC, ROAS

### What We Decor Will Not Do to Grow (Consistent with `01-business-vision.md`)

- Compete primarily on lowest price
- Sacrifice quality or trust for volume
- Accept bookings that cannot be executed well
- Increase price after booking confirmation
- Force customers into predefined packages

---

## Business Rules

*Rules captured during interviews. These must be reflected in any future system.*

### Sales and Pipeline Rules

| ID | Rule |
|----|------|
| BR-01 | Every enquiry is received by Ilyas first, entered in Lead Management Application, then assigned to Zakir |
| BR-02 | Pipeline starts at **New** when enquiry is created |
| BR-03 | Lead remains **In Talks** during requirements, design, quotation, negotiation, and follow-up |
| BR-04 | Booking is **Approved** only when advance payment (~20% of quotation) is verified—not on verbal confirmation |
| BR-05 | **Not Interested** = customer explicitly declines |
| BR-06 | **Closed / Lost** = no response, chose competitor, or inactive after follow-ups |
| BR-07 | **Cancelled** = only after Approved; refund case-by-case |
| BR-08 | Follow-up reminders are manually scheduled in Lead Management Application |
| BR-09 | Lost reasons are not currently captured (future requirement) |

### Pricing and Quotation Rules

| ID | Rule |
|----|------|
| BR-10 | All quotations prepared by Zakir; no approval hierarchy or value ceiling |
| BR-11 | Every quotation is fully customized; no fixed packages |
| BR-12 | Customer receives single bundled price (no line-item breakdown) |
| BR-13 | Pricing follows internal mental model: materials, labour, transport, complexity, experience |
| BR-14 | Discounts generally not offered; negotiate by adjusting scope/design, not price |
| BR-15 | Quotation updated in place as requirements evolve |
| BR-16 | Not GST registered; no GST on quotations |
| BR-17 | No formal quotation validity period |

### Payment Rules

| ID | Rule |
|----|------|
| BR-18 | Advance: ~20% of quotation (standard; exceptions case-by-case) |
| BR-19 | Balance: usually after event completion |
| BR-20 | Payment methods: UPI, bank transfer, cash only |
| BR-21 | Payment confirmed via UPI/bank notification (WhatsApp) or manual acknowledgment (cash) |

### Financial and Trust Rules

| ID | Rule |
|----|------|
| BR-22 | Agreed quotation price cannot increase after booking confirmation |
| BR-23 | Material cost increases after confirmation are absorbed by We Decor |
| BR-24 | Additional charges only when customer requests scope changes |
| BR-25 | Cancellation refund: full if no materials purchased; deduct incurred expenses if materials/preparation started |
| BR-26 | No day-based cancellation tiers currently; each case evaluated individually |
| BR-27 | Cancellation policy not formally documented or shared with customers today |

### Operational Rules

| ID | Rule |
|----|------|
| BR-28 | Fresh flowers purchased close to event date |
| BR-29 | Artificial materials reused when possible |
| BR-30 | Materials purchased after booking confirmed, before event |
| BR-31 | Site visit generally not required for home celebrations |

---

## Key Metrics

### Metrics We Decor Can State Today

| Metric | Value | Confidence |
|--------|-------|------------|
| Typical monthly revenue | ₹1.5L – ₹2.5L | Approximate |
| Peak monthly revenue | ~₹3L | Approximate |
| Events per month | 15–20 typical | Approximate |
| Average booking value | ~₹10,000 | Approximate |
| Booking value range (6 months) | ₹5,000 – ₹52,000 | Known |
| Enquiries per month (ads active) | ~200 | Approximate |
| Conversion rate | ~10% | Approximate |
| Instagram Ads enquiry share | ~80% | Approximate |
| Instagram Ads monthly spend | ₹4,000 – ₹5,000 | Known |
| Advance payment | ~20% | Standard practice |
| Haldi revenue share | ~60% | Approximate |
| Google reviews | 75+ five-star | Known |
| Permanent decorators | 2 + 2 founders; temporary pool as needed | Known |

### Metrics Not Currently Measured (Future Event OS Targets)

| Metric | Why It Matters |
|--------|----------------|
| Cost per booking | Marketing efficiency |
| CAC by channel | Budget allocation |
| ROAS by campaign | Ad optimization |
| Channel conversion rates | Channel investment |
| Event-level P&L | Pricing and design decisions |
| Margin by event type | Focus on profitable celebrations |
| Margin by decoration component | Quotation intelligence |
| Monthly operating burn | Financial planning |
| Sales cycle length | Pipeline optimization |
| Lost reason distribution | Competitive strategy |
| Repeat customer rate | Relationship strategy effectiveness |
| Lifetime customer value | Long-term customer strategy ROI |
| Enquiry volume without ads | Dependency risk quantification |
| Outstanding receivables | Cash flow management |
| Profit by Bangalore area | Operational routing |
| Profit by decorator/team | Resource optimization |
| Profit by vendor | Vendor selection |
| Milestone re-engagement rate | Customer intelligence platform |

---

## Future Opportunities

| Opportunity | Basis | Horizon |
|-------------|-------|---------|
| **Home celebration market dominance** | Haldi ~60% revenue; underserved segment; SEO/search ambition | Near-term |
| **Lifelong customer relationships** | Repeat/referral growing; milestone strategy defined | Medium-term |
| **Complete event management** | Customer enquiries already requesting; informal vendor coordination today | 1–2+ years |
| **Google Ads + SEO diversification** | Reduce Instagram dependency; website investment | Near-term |
| **Dedicated storage/warehouse** | Planned within 12 months; improves inventory/material management | Near-term |
| **End-to-end marketing attribution** | CPL tracked externally; integration gap identified | Near-term |
| **Event-level financial analytics** | No margin data today; founders want informed decisions | Near-term |
| **Quotation Intelligence Engine** | Zakir's mental model digitized; historical quote reference exists | Medium-term |
| **Customer Intelligence Platform** | Milestone tracking, preferences, proactive outreach | Medium-term (see `03-customer-journey.md`) |
| **Peak season ad optimization** | Currently flat ad spend; room to scale in high-demand periods | Near-term |

---

## Software Implications

*Internal product direction for Event OS and Yuva Minds. Not customer-facing We Decor branding.*

These implications are derived from documented business gaps—not speculative features.

### Priority Modules (Derived from Business Model)

| Business Gap | Software Implication | Priority |
|--------------|---------------------|----------|
| Disconnected Lead Management Application and Quotation and Billing Application | Unified lead → quote → payment → execution platform | Critical |
| ~80% Instagram dependency; manual source tracking | Marketing attribution module; Meta Ads integration | High |
| Pipeline in Lead Management Application works but limited analytics | Configurable pipeline; future granular stages | Medium |
| No lost reason capture | Structured lost reason on Closed / Lost and Not Interested | High |
| Manual follow-up reminders | Follow-up workflow with configurable rules | High |
| Zakir's mental pricing model not digitized | Quotation module with internal cost components + AI-assisted suggestions from history | Critical |
| Single customer price, no internal breakdown | Internal line items hidden from customer PDF | High |
| No event-level P&L | Finance module: cost entry, margin per event | High |
| Cancellation/refund case-by-case | Cancellation workflow with expense deduction tracking | Medium |
| No centralized scheduling | Calendar module: events, staff, conflicts, same-day multi-event view | Critical |
| WhatsApp as operational backbone | WhatsApp integration or structured communication log | High |
| No CAC/ROAS/CPL integration | Analytics dashboard: ad → lead → booking → revenue | High |
| Balance after event; advance at booking | Payment milestone tracking; receivables view | Medium |
| Lifelong customer strategy | Customer Intelligence Platform: milestones, preferences, proactive outreach | Strategic |
| Material cost volatility post-booking | Margin contingency in quotes; cost change alerts | Medium |
| Referral/repeat not measured | Customer source lifecycle tracking; repeat rate analytics | Medium |

### Quotation Intelligence Engine (Future Vision — From Interview)

Event OS should eventually learn from historical events to suggest quotations based on:

- Similar past events
- Design selected
- Decoration components
- Material costs
- Venue distance
- Labour required
- Seasonal flower prices
- Target profit margin (once measured)

**Principle:** Never replace Zakir's judgment—accelerate and consistency-check it.

### Business Intelligence Module (Future Vision — From Interview)

Answer questions currently unanswerable:

- Which event type makes the most profit?
- Which decorator is most profitable?
- Which vendor offers the best margins?
- Which ad campaign generates highest profit (not just enquiries)?
- Which customer segments are most valuable?
- Which Bangalore areas are most profitable?
- Which decoration components have highest margin?

### Customer Intelligence Platform (Future Vision — From Interview)

Beyond CRM:

- Track every celebration, milestone, preference
- Proactive reconnection before birthdays, anniversaries, engagements, weddings
- Support "trusted celebration partner for life" strategy
- Foundation for `03-customer-journey.md`

---

## Consistency Review with `01-business-vision.md`

### Verified Consistent

| Topic | Status |
|-------|--------|
| Typical revenue ₹1.5–2.5 lakh; peak ~₹3 lakh | ✓ Consistent across Executive Summary, Revenue Model, Key Metrics |
| Events 15–20 typical; peak up to ~25 | ✓ Consistent (peak figure references `01-business-vision.md`) |
| Average booking ~₹10,000; range ₹5k–₹52k | ✓ Consistent |
| Haldi ~60% revenue | ✓ Consistent |
| Pipeline: New → In Talks → Approved → Completed | ✓ Consistent (authoritative in this document) |
| Advance ~20%; balance after event | ✓ Consistent with BR-18, BR-19 |
| Zakir quotes; Ilyas intake | ✓ Consistent with Founder Responsibilities |
| Growth: home celebrations + gradual event management | ✓ Consistent |
| Instagram Ads primary; Google Ads inactive | ✓ Documented in 02; 01 lists Google Ads as broader strategy (see below) |
| Future vs current clearly separated | ✓ Future Revenue, Future Opportunities, Software Implications marked |

### Known Cross-Document Notes (Not Contradictions)

| Topic | `01-business-vision.md` | `02-business-model.md` | Resolution |
|-------|-------------------------|------------------------|------------|
| Lead sources | Lists website, Instagram, Google Ads, SEO, referrals as primary | **Instagram Ads ~80% today; Google Ads inactive (0%)** | **02 reflects current operational state.** 01 describes broader channel strategy including planned Google Ads restart. |
| Enquiry volume | ~200/month when ads active | Consistent | ✓ |
| Conversion | ~10% | Consistent | ✓ |
| Bottleneck | Operational coordination | **High competition + multi-event management + coordination across Bangalore** | **02 is more precise** per founder correction |
| Customer strategy | Referrals/repeat significant | **Lifelong celebration partner strategy** | ✓ (02 extends 01) |
| Tools | Lead Management Application + Quotation and Billing Application separate | Consistent + Technology Stack section added | ✓ |
| Trust/pricing rules | Honor price after booking | Consistent (BR-22, BR-23, Key Business Principles) | ✓ |

### Internal Consistency (Within This Document)

| Check | Result |
|-------|--------|
| Revenue figures match across sections | ✓ No conflicts found |
| Event counts match across sections | ✓ No conflicts found |
| Pipeline statuses match across sections | ✓ No conflicts found |
| Founder responsibilities match Sales Funnel and Customer Acquisition | ✓ No conflicts found |
| Business Rules align with Key Business Principles and Decision-Making Principles | ✓ No conflicts found |
| North Star in Company DNA matches North Star Metric section | ✓ No conflicts found |
| Technology Stack matches Cost Structure software references | ✓ No conflicts found |

| Staffing model authoritative in `06-staff-management.md` v1.0 | ✓ Synchronized in v1.2 |

**Recommendation for `01-business-vision.md` (future revision):** Update lead sources to note Instagram Ads as current primary channel (~80%) and Google Ads as inactive but planned.

---

## Document Review & Quality Audit

### Version 1.1 Assessment

| Dimension | Score (v1.0) | Score (v1.1) | Rationale for Change |
|-----------|--------------|--------------|----------------------|
| **Business Clarity** | 9/10 | **9.5/10** | Company DNA, founder roles, and competitive advantages provide faster orientation for new readers |
| **Financial Understanding** | 6/10 | **6/10** | Unchanged—honest gaps preserved; no invented metrics |
| **Operational Completeness** | 8/10 | **8.5/10** | Founder Responsibilities and Technology Stack clarify who does what with which tools |
| **SaaS Readiness** | 8/10 | **9/10** | Decision principles, key principles, and tech stack give engineers clearer module boundaries |
| **AI Readiness** | 9/10 | **9.5/10** | North Star and lifelong relationship principles give AI agents explicit success criteria |
| **Strategic Value** | — | **9/10** | Document now functions as executive + operational reference in one place |

**Overall document quality: 9/10**

### Editorial Review (Version 1.1)

#### Repeated Information (Acceptable)

| Overlap | Recommendation |
|---------|----------------|
| Key Business Principles ↔ Business Rules (BR-01–31) | **Keep both.** Principles = one-page summary; BR = formal registry for systems |
| North Star in Company DNA ↔ North Star Metric section | **Keep both.** DNA = context; dedicated section = measurement detail |
| Why Customers Choose We Decor ↔ Competitive risks (price competition) | **Keep both.** Advantages vs loss reasons are complementary |
| Founder Responsibilities ↔ Sales Funnel "Updated By" column | **Keep both.** Roles section orients; funnel shows workflow |
| Technology Stack ↔ Cost Structure (Software row) | **Cross-reference only;** no merge needed |

#### Sections Not Merged (Deliberate)

- **Long-Term Customer Strategy** remains separate from Company DNA vision—DNA is identity; Long-Term Customer Strategy is operational philosophy and future capability gap
- **Software Implications** remains separate from Technology Stack—stack = today; implications = future Event OS direction

#### Cross-References Added (v1.1)

- Executive Summary → new front-matter sections
- Company DNA → North Star Metric section; `01-business-vision.md`
- Key Business Principles → Business Rules registry

#### Readability Improvements Made (v1.1)

- Strategic front matter grouped after Executive Summary for founder/employee onboarding
- Technology Stack consolidated in one table (previously scattered across Cost Structure and Customer Acquisition)
- Consistency review split into verified consistent, cross-document notes, and internal checks

#### Not Changed (Deliberate)

- Revenue Model through Open Questions body text preserved verbatim where not structurally enhanced
- All BR-01–31 rules preserved
- All "Not Currently Measured" markers preserved
- No financial estimates added

---

## Version 1.1 Change Log

| Change Type | Detail |
|-------------|--------|
| **Added** | Company DNA (Mission, Vision, Philosophy, Values, Brand Promise, North Star reference) |
| **Added** | Founder Responsibilities (Ilyas and Zakir) |
| **Added** | Why Customers Choose We Decor |
| **Added** | Decision-Making Principles |
| **Added** | Key Business Principles (one-page summary) |
| **Added** | Current Business Technology Stack |
| **Added** | North Star Metric (dedicated section with supporting metrics) |
| **Enhanced** | Consistency Review (internal + cross-document) |
| **Enhanced** | Document Review & Quality Audit (v1.1 scores, editorial review) |
| **Updated** | Document Metadata and Version History to 1.1 |
| **Unchanged** | All business facts, figures, pipeline statuses, business rules BR-01–31, interview-derived content |

---

## Open Questions

*For future Business Bible documents. Do not invent answers.*

### For `02-business-model.md` (If Business Changes)

- Formal monthly salary totals and founder compensation structure
- Monthly operating burn calculation
- Exact enquiry volume when Instagram Ads paused

### For `03-customer-journey.md`

- Detailed customer lifecycle stages beyond sales pipeline
- Repeat customer rate and referral rate
- How customers discover We Decor vs return intentionally
- Milestone data currently captured (if any) in Lead Management Application
- Proactive outreach process (if any informal today)

### For `04-sales-process.md`

- Target response time for first contact
- Formal follow-up cadence rules
- Structured lost reason taxonomy
- Pipeline stage transition rules and permissions

### For `05-event-execution.md` / `06-staff-management.md`

- Staff assignment process for events
- Same-day multi-event coordination procedure
- Setup time buffers and punctuality standards
- Event-day issue escalation

### For `07-vendor-management.md`

- Trusted vendor network for informal coordination
- Vendor payment terms
- Future partner model for event management services

### For `08-inventory-workflow.md`

- Current material storage locations and inventory tracking
- Dedicated warehouse requirements and layout

### For `09-finance-workflow.md`

- Formal cancellation policy document for customers
- Refund approval workflow
- GST registration timeline
- Accounting software adoption plan

### For `10-marketing-workflow.md` / `11-social-media-workflow.md`

- Instagram Ads Manager typical CPL ranges
- Campaign structure and creative process
- Google Ads historical performance and restart plan
- Content/SEO strategy detail

### For `14-business-rules.md`

- Complete business rules registry (BR-01–31 are start)
- Day-based cancellation tiers (if introduced)
- Minimum margin policies (if introduced)

### For `15-kpis.md`

- KPI targets once measurement begins
- Dashboard definitions for founders

---

## Document Governance

### Document Owner

**Ilyas** (Co-Founder, We Decor Events) owns this document.

### Primary Reviewer

**Zakir** (Co-Founder, We Decor Events) validates operational and commercial accuracy.

### Review Schedule

| Review Type | Frequency |
|-------------|-----------|
| Scheduled review | Every 6 months (Next: 2027-01-07) |
| Triggered review | Within 30 days of material business model change |

### Changes Requiring Revision

- Revenue model changes (new services, pricing philosophy, GST registration)
- Customer acquisition channel shifts (new primary channel, Google Ads activation)
- Pipeline status changes in Lead Management Application
- Payment term changes (advance %, balance timing)
- Cancellation or refund policy formalization
- Material change to cost structure (dedicated warehouse, team size doubling)
- Financial tracking maturity (when event-level P&L begins, update metrics sections)

### Freeze Policy

**Version 1.1 is frozen.** Do not edit unless the business materially changes. Editorial passes that add structure without changing business facts may increment minor version (1.x). Material business changes increment per governance rules above. Next planned document: **`03-customer-journey.md`**.

---

## Related Documents

### Business Bible

| Document | Relationship |
|----------|--------------|
| [01-business-vision.md](./01-business-vision.md) | **Prerequisite** — why We Decor exists |
| [03-customer-journey.md](./03-customer-journey.md) | **Next** — customer lifecycle and Customer Intelligence Platform |
| [04-sales-process.md](./04-sales-process.md) | Expands sales funnel and follow-up |
| [09-finance-workflow.md](./09-finance-workflow.md) | Expands cash flow, payments, profitability tracking |
| [10-marketing-workflow.md](./10-marketing-workflow.md) | Expands acquisition and attribution |
| [14-business-rules.md](./14-business-rules.md) | Complete business rules registry |
| [15-kpis.md](./15-kpis.md) | KPI definitions and targets |
| [17-automation-opportunities.md](./17-automation-opportunities.md) | Automation derived from this model |
| [20-saas-evolution-plan.md](./20-saas-evolution-plan.md) | We Decor → multi-tenant product path |

### Engineering Foundation

| Document | Relationship |
|----------|--------------|
| [04-business-domain.md](../04-business-domain.md) | Domain model for modules implied here |
| [06-module-design.md](../06-module-design.md) | Module boundaries for software implications |
| [11-roadmap.md](../11-roadmap.md) | Product delivery phases |

---

*Version 1.1 — Approved*  
*Last updated: 2026-07-07*  
*Source: Founder interview (Ilyas) + editorial review*  
*Next document: [03-customer-journey.md](./03-customer-journey.md)*
