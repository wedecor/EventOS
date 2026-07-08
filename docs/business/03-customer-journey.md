# We Decor Events — Customer Journey

## Document Metadata

| Field | Value |
|-------|-------|
| **Document Owner** | Ilyas (Co-Founder, We Decor Events) |
| **Primary Reviewer** | Zakir (Co-Founder, We Decor Events) |
| **Status** | Approved |
| **Version** | 1.0 |
| **Created Date** | 2026-07-07 |
| **Last Updated** | 2026-07-07 |
| **Next Review Date** | 2027-01-07 |
| **Document Purpose** | Define the end-to-end customer journey at We Decor Events—lifecycle stages, communication touchpoints, customer data, relationship strategy, pain points, and Customer Intelligence Platform requirements—based on founder interviews. This is the authoritative reference for customer experience and relationship module design. |

---

## Version History

| Version | Date | Author | Summary of Changes |
|---------|------|--------|-------------------|
| 0.1 | 2026-07-07 | Ilyas (Founder interview) | Initial interview capture across lifecycle, customer types, communication, pre/post-event experience, data model, long-term vision, and Customer Intelligence Platform priorities |
| 1.0 | 2026-07-07 | Yuva Minds (Editorial review) | **Approved.** Full document produced with customer journey rules, software implications, consistency review against `01-business-vision.md` and `02-business-model.md`, and quality audit |

---

## Purpose of This Document

This document describes **how customers experience We Decor Events from first awareness through long-term relationship**—what happens at each stage, who owns each step, what data is captured, where information lives, and where the journey breaks down today.

It is derived from direct founder interviews (July 2026–July 2027). **Current state** is distinguished from **future vision**. Metrics that are not tracked are explicitly marked **Not Currently Measured**—never estimated.

**Intended audience:** Founders, product managers, engineers, AI agents, investors, and business leaders who need to understand the customer journey before building Event OS customer, communication, and relationship modules.

**Source:** Founder interview (Ilyas), July 2026–July 2027  
**Status:** Version 1.0 — Approved (Document 03 of 20)

**Prerequisites:**
- [01-business-vision.md](./01-business-vision.md)
- [02-business-model.md](./02-business-model.md)

---

## Executive Summary

We Decor's customer journey today is **WhatsApp-centric, manually coordinated, and transactional at the system level**—even though the business philosophy is **lifelong family relationships**.

A typical customer decides to celebrate (event date usually already fixed), discovers We Decor primarily through **Instagram Ads (~80% of enquiries)**, sends a price-first enquiry, and is qualified by **Ilyas on Instagram DM** before being moved to WhatsApp. **Ilyas** creates a lead in the Lead Management Application and assigns **Zakir**, who handles requirements, designs, quotation, and follow-up until **advance payment (~20%)** moves the lead to **Approved**. After event execution, the lead moves to **Completed**; balance is collected, a Google review is requested, and **the journey ends**—no thank-you, no follow-up, no milestone outreach.

**Each celebration is a separate lead.** There is no consolidated customer or family profile. Repeat customers are recognized informally via WhatsApp history and memory. Referral source is not tracked. Customer preferences, full addresses, design discussions, and feedback live primarily in **WhatsApp**—not in structured systems.

**Post-event, the relationship goes dormant** until the customer contacts We Decor again for another celebration.

**Future vision:** Event OS should enable We Decor to become each **family's trusted celebration partner for life**—linking celebrations to a family profile, remembering milestones, surfacing preferences and history, and reminding the team to reach out proactively before upcoming celebrations. Outreach would be **system-reminded, team-sent**—never spammy or fully automated without human review.

**Customer Intelligence Platform priority (founder-ranked):**
1. Unified customer and family profile
2. Complete customer timeline (enquiries, quotations, events, payments, photos, communications)
3. Milestone and relationship management
4. Communication and follow-up management
5. Customer preferences and event intelligence

*For sales pipeline detail and payment rules, see [02-business-model.md](./02-business-model.md). For strategic vision, see [01-business-vision.md](./01-business-vision.md).*

---

## Complete Customer Lifecycle (Current State)

*Customer perspective plus system status. Stages 1–18 from founder interview.*

| # | Stage | Who Initiates | Channel | Frequency | Lead Status |
|---|-------|---------------|---------|-----------|-------------|
| 1 | Customer decides to celebrate | Customer | N/A | Every time | — |
| 2 | Customer discovers We Decor | Customer | Instagram Ads (majority), website, referral, repeat WhatsApp | Every enquiry | — |
| 3 | Initial enquiry (usually price-first) | Customer | Instagram DM / WhatsApp / website | Every enquiry | — |
| 4 | Lead qualification | We Decor (Ilyas) | Instagram DM (Ads); WhatsApp/website for other channels | Every qualified enquiry | — |
| 5 | Lead created in Lead Management Application | We Decor (Ilyas) | Internal | Every qualified enquiry | **New** |
| 6 | Lead assigned to Zakir; WhatsApp handover communicated | We Decor (Ilyas) | Instagram DM / WhatsApp | Every qualified enquiry | **New** |
| 7 | Requirement discussion | We Decor (Zakir) | WhatsApp | Every qualified enquiry | **In Talks** |
| 8 | Customer decision (pricing, designs, discussion with Zakir) | Customer | WhatsApp | Every booking | In Talks |
| 9 | Booking confirmation (advance payment) | Customer | UPI / bank transfer / cash | Every confirmed booking | **Approved** |
| 10 | Pre-event coordination | Customer and We Decor | WhatsApp / phone | Every booking | Approved |
| 11 | Event execution | We Decor | On-site | Every event | Approved → **Completed** |
| 12 | Customer experience / celebration | Customer | Face-to-face | Usually | Completed |
| 13 | Event photography | We Decor | On-site | Usually | Completed |
| 14 | Balance payment | Customer | UPI / bank transfer / cash | Usually | Completed |
| 15 | Google review request | We Decor (Zakir) | WhatsApp | Usually | Completed |
| 16 | Thank-you message | — | — | **Does not exist** | — |
| 17 | Post-event follow-up | — | — | **Does not exist** | — |
| 18 | Staying in touch / milestone outreach | — | — | **Does not exist** | — |
| 19 | Repeat customer (optional) | Customer | WhatsApp | Sometimes | New lead created |

### Lifecycle Notes

- **Pre-enquiry:** Event date is usually finalized before the customer searches for a decorator.
- **First message:** Typically asks about price — e.g. *"What is the price?"*
- **Qualification fields:** Event type, event date, event location, WhatsApp number. Purpose: verify Bangalore serviceability, assess urgency, move to WhatsApp.
- **Booking reservation:** We Decor does not reserve the booking until advance payment is received.
- **Pre-event updates:** No regular status updates between booking confirmation and event unless required.
- **Why customers choose We Decor:** Pricing, discussion with Zakir, decoration designs — **Not Currently Measured** as structured win/loss data.

### Lifecycle Diagram

```
Customer decides to celebrate (date usually fixed)
        ↓
Discovers We Decor (Instagram Ads majority / website / referral / repeat WhatsApp)
        ↓
Initial enquiry — usually price-first
        ↓
Qualification (Ilyas) — event type, date, location, WhatsApp number
        ↓
Lead created [New] + assigned to Zakir (Ilyas)
        ↓
Customer informed: team will contact on WhatsApp
        ↓
Zakir — requirements, designs, pricing, quotation [In Talks]
        ↓
Customer evaluates (compares decorators; reasons not measured)
        ↓
Advance payment [Approved]
        ↓
Customer shares exact location + decoration completion time
        ↓
Pre-event reconfirmation (timing varies; no fixed rule)
        ↓
Event execution [Completed]
        ↓
Customer enjoys celebration (informal appreciation if team met)
        ↓
Photos captured (usually, before celebration starts)
        ↓
Balance payment (usually after event; timing varies)
        ↓
Google review requested (usually; low response rate)
        ↓
Journey ends — no thank-you, follow-up, or milestone outreach
        ↓
(Optional) Repeat customer messages WhatsApp → new lead → same flow
```

---

## Channel-Specific Intake Flows

All channels converge after Ilyas creates the lead and assigns Zakir. Remaining process is identical.

### Instagram Ads Enquiries (Majority)

| Step | Action | Owner |
|------|--------|-------|
| 1 | Customer responds to ad via Instagram DM | Customer |
| 2 | Ilyas sends standard qualification message | Ilyas |
| 3 | Customer provides event type, date, location, WhatsApp number | Customer |
| 4 | Ilyas creates lead in Lead Management Application [New] | Ilyas |
| 5 | Ilyas assigns lead to Zakir | Ilyas |
| 6 | Ilyas informs customer team will contact on WhatsApp | Ilyas |
| 7 | Zakir contacts customer on WhatsApp [In Talks] | Zakir |
| 8 | Customer pays advance [Approved] | Customer / Zakir |
| 9 | Event executed [Completed] | Zakir |

### Website Enquiries

```
Website enquiry received
    → Ilyas receives enquiry
    → Collects missing qualification details if required
    → Creates lead in Lead Management Application
    → Assigns to Zakir
    → Customer contacted on WhatsApp
    → Same flow as Instagram Ads from step 7 onward
```

### WhatsApp Direct Enquiries

```
Customer messages We Decor on WhatsApp
    → Ilyas receives enquiry
    → Collects qualification details if required
    → Creates lead in Lead Management Application
    → Assigns to Zakir
    → Zakir continues sales discussion on WhatsApp
    → Same flow from In Talks onward
```

### Repeat Customers

```
Existing customer messages on WhatsApp
    → Ilyas receives enquiry
    → Creates NEW lead for the new celebration
    → Assigns to Zakir
    → Zakir handles via WhatsApp
```

**Rule:** Each celebration is treated as a separate lead even when the customer already exists. No link to previous events in the Lead Management Application.

---

## Ownership Matrix

| Stage | Owner |
|-------|-------|
| First enquiry received | Ilyas |
| Qualification (Instagram / website / WhatsApp) | Ilyas |
| Lead creation | Ilyas |
| Lead assignment | Ilyas |
| Customer handover to WhatsApp | Ilyas |
| Requirement discussion | Zakir |
| Design discussion | Zakir |
| Pricing and quotation | Zakir |
| Follow-ups during In Talks | Zakir |
| Booking confirmation (advance verification) | Zakir |
| Pre-event coordination | Zakir |
| Event execution | Zakir and operations team |
| Completion status update | Zakir |
| Balance collection and review request | Zakir |
| Marketing and lead generation | Ilyas |
| Internal systems | Ilyas |

*Cross-reference: [Founder Responsibilities](./02-business-model.md#founder-responsibilities) in `02-business-model.md`.*

---

## Customer Types

### Identification (Current State)

| Type | How Identified | Formal Process |
|------|----------------|----------------|
| **First-time** | Default — no prior interaction known | None |
| **Repeat** | WhatsApp number, conversation history, team memory | None — no structured repeat flag in Lead Management Application |
| **Referral** | Customer mentions recommendation; sometimes asked how they found We Decor | None — no referral tracking or attribution |

### Mix and Conversion

| Metric | Status |
|--------|--------|
| Share of first-time vs repeat vs referral enquiries | **Not Currently Measured** |
| Referral/repeat conversion vs cold enquiries | Believed higher; **Not Currently Measured** (per `02-business-model.md`) |

### Treatment by Type

| Attribute | Current State |
|-----------|---------------|
| Sales process | **Same for all types** — no different pricing, quotation, scheduling, or discount rules |
| Informal difference | Repeat customers usually require **less trust-building** because they already know We Decor |
| Referral channel | **No dedicated channel** — referrals arrive via WhatsApp, Instagram, or phone like any enquiry |
| Repeat history source | **WhatsApp chat + Zakir's memory** — Lead Management Application does not reference previous events |

### Structural Implication

There is **no customer entity** today—only disconnected leads. Event OS must introduce a persistent **customer/family profile** that links multiple celebrations over time.

---

## Communication Touchpoints

### Standard Messages

#### Instagram Qualification (Ilyas — template exists)

> Please share the following details:
>
> - Event Type
> - Event Date
> - Event Location
> - WhatsApp Number

After customer responds:

> Thank you.
> Our team will contact you shortly on WhatsApp.

#### First WhatsApp Message (Zakir — no fixed template)

Zakir introduces himself and discusses event requirements, decoration preferences, budget, design ideas, and event details.

### Touchpoint Summary

| Stage | Owner | Channel | Pattern |
|-------|-------|---------|---------|
| Instagram qualification | Ilyas | Instagram DM | **Standard template** |
| First WhatsApp contact | Zakir | WhatsApp | No fixed template |
| In Talks follow-up | Zakir | WhatsApp / phone | Manual; no fixed cadence; judgement-based |
| Design sharing | Zakir | WhatsApp | Photos/videos from portfolio and past events — no catalogue |
| Quotation delivery | Zakir | WhatsApp | PDF from Quotation and Billing Application |
| Post-Approved | Zakir | WhatsApp / phone | Location + timing; reconfirmation near event — no routine updates |
| Event day | Zakir / ops | WhatsApp / phone | As needed only — no standard status messages |
| Post-Completed | Zakir | WhatsApp | Balance collection + Google review request — no thank-you or follow-up |

### Follow-Up During In Talks

- **Completely manual** — no fixed cadence
- Zakir follows up based on judgement and expected customer decision timeline
- If customer becomes unresponsive, timing varies by situation
- Lead Management Application supports **manual follow-up reminder dates** set by Zakir (per `02-business-model.md`); no fixed number of follow-ups or standard schedule

### Response Time

| Role | Practice | Formal SLA |
|------|----------|------------|
| Ilyas | Responds as soon as reasonably possible | **None** |
| Zakir | Usually contacts same day after assignment | **None** |

### Phone Calls

Used when quicker discussion needed, complex requirements easier verbally, pre-event coordination required, exact location/timing clarification needed, or WhatsApp insufficient. Routine communication is primarily WhatsApp.

---

## Pre-Event Experience (Approved → Event Day)

*Customer perspective between booking confirmation and event execution.*

### Reconfirmation

| Attribute | Current State |
|-----------|---------------|
| Fixed timeline | **None** — varies by event date, requirements, and customer situation |
| Practice | Zakir contacts customer as event approaches to reconfirm details |

### Information Required from Customer

| Required | When |
|----------|------|
| Exact event location | After Approved |
| Decoration completion time | After Approved |
| Venue access (someone to let team in) | As needed |
| Venue access instructions | As needed |
| Event-specific access information | As needed |

**No formal pre-event checklist exists today.**

### Design or Scope Changes After Approved

| Attribute | Current State |
|-----------|---------------|
| Allowed | **Yes** — customers sometimes add items, change design, or remove items |
| Pricing | Quotation updated for revised requirements; customer informed before proceeding if additional work/materials required |
| Minor adjustments | May be handled without formal quotation changes depending on situation |
| Formal process | **None** |

*Cross-reference: BR-24 (additional charges only for scope changes), BR-22/BR-23 (no price increase without scope change).*

### Customer-Initiated Cancellation

| Step | Current Practice |
|------|------------------|
| Contact | Customer contacts Zakir via WhatsApp or phone |
| Refund if no materials/preparation | Advance generally refunded in full |
| Refund if materials purchased or expenses incurred | Refund reduced by costs incurred |
| Policy communication | **No formal written cancellation policy shared with customers** |
| Refund timeline | **Not defined** |

*Cross-reference: BR-25, BR-26, BR-27 in `02-business-model.md`.*

### We Decor-Initiated Cancellation or Rescheduling

**Extremely rare.** No standard process — such situations have generally not occurred.

### Customer Anxiety Before Event

- Most customers **do not repeatedly ask for updates** — they wait until event day
- We Decor initiates reconfirmation as event approaches
- Customers reach out only for changes or specific questions

---

## Event Day Experience

### Team Arrival

| Attribute | Current State |
|-----------|---------------|
| Standard buffer | **None fixed** |
| Planning factors | Decoration complexity, travel time, event location, requested completion time |
| Objective | Complete decoration **before** agreed time |

### Customer Presence

Varies — sometimes present during setup, sometimes arrives only after decoration is completed. No fixed pattern.

### During Setup

- Team completes setup; coordinates with customer only if required
- Typical interactions: clarifying setup location, confirming last-minute requirements, requesting access
- Otherwise customer leaves team to work

### Completion Confirmation

- Customer sees completed decoration in person, **or**
- Team informs customer if they are not present
- **No formal completion confirmation workflow or standard message**

### Customer Reaction ("Trust Won" Moment)

| Attribute | Detail |
|-----------|--------|
| Formal inspection | Customers generally do **not** perform formal inspection |
| In-person appreciation | Common if customer meets team after completion |
| WhatsApp appreciation | Sometimes sent after event |
| Outcome | Customer proceeds to enjoy celebration |
| Trust definition | Trust confirmed when customer sees completed decoration — reaction, appreciation, positive feedback (per `01-business-vision.md`) |

### Event-Day Issues

| Issue | Handling |
|-------|----------|
| Minor last-minute customer changes | Case-by-case direct communication |
| Venue access delays | Case-by-case |
| Minor coordination issues | Case-by-case |
| Formal incident process | **None** |
| Late arrival | Past 30-minute late incident led to improved internal planning (per `01-business-vision.md`) |

### Balance Payment on Event Day

| Attribute | Current State |
|-----------|---------------|
| Typical timing | Generally collected **after** decoration completed |
| Variation | Timing varies by customer and event |
| Coordinator | Zakir via WhatsApp or direct communication |
| Fixed rule | **None** — not required before, during, or immediately after celebration |

---

## Post-Event Experience

### Balance Payment Follow-Up

If balance not paid after event, Zakir follows up via WhatsApp or phone until payment received. **No fixed schedule or payment deadline.**

### Google Review Request

| Attribute | Current State |
|-----------|---------------|
| Channel | WhatsApp |
| Template | **None** |
| Timing | Usually after event once event communication concluded; varies |
| Response rate | Known to be small percentage; **Not Currently Measured** |

### Event Photos

| Attribute | Current State |
|-----------|---------------|
| Primary use | Portfolio, Instagram, marketing, future design reference |
| Delivery to customer | **Not automatic** — shared if customer requests |
| Standard delivery process | **None** |
| Storage | Local storage / Google Drive / marketing folders — **not linked to customer record** |

### Instagram Posting Permission

**No formal permission process.** Permission requested only in certain situations. No documented consent policy.

### Negative Feedback

| Attribute | Current State |
|-----------|---------------|
| How it surfaces | Direct communication — WhatsApp or during event |
| Typical issues | Quality concerns, minor design changes, coordination issues |
| Handling | Discussed directly; team tries to resolve immediately |
| Formal process | **None** — no complaint handling or escalation |
| Negative Google reviews | **Very uncommon** |

### Silent Customers — Journey End

Once balance is completed and Google review request sent, **the customer journey ends**.

If customer does not respond to review request, **no further follow-up**.

**Does not exist today:**
- Thank-you messages
- Customer satisfaction surveys
- Follow-up calls
- Anniversary reminders
- Birthday reminders
- Customer re-engagement campaigns
- Loyalty programmes

**Relationship remains inactive until customer contacts We Decor again.**

---

## Customer Data Model (Current State)

### A. Lead / Enquiry Data

| Field | Where Stored |
|-------|--------------|
| Customer name | Lead Management Application |
| Phone / WhatsApp number | Lead Management Application |
| Instagram handle | **Not captured** |
| Event type | Lead Management Application |
| Event date | Lead Management Application |
| Event location (area) | Lead Management Application |
| Event location (full address) | **WhatsApp only** (usually after booking) |
| Lead source / channel | Lead Management Application |
| Referral source | **Not captured** |
| Budget (if discussed) | Lead Management Application |
| Notes / special requirements | Lead Management Application |

### B. Sales Data

| Field | Where Stored |
|-------|--------------|
| Design preferences | WhatsApp conversation |
| Photos / designs shared | WhatsApp conversation |
| Quotation amount | Quotation and Billing Application |
| Quotation PDF | Quotation and Billing Application |
| Advance amount | Quotation and Billing Application |
| Payment method / proof | WhatsApp + Quotation and Billing Application |
| Agreed decoration completion time | WhatsApp |

### C. Post-Booking / Post-Event Data

| Field | Where Stored |
|-------|--------------|
| Final exact address | WhatsApp |
| Event photos | Local / Google Drive / marketing folders — **not linked to customer** |
| Customer feedback | WhatsApp only |
| Google review status | **Not captured** |
| Balance payment | Quotation and Billing Application |

### D. Relationship Data

| Field | Current State |
|-------|---------------|
| Same customer linked across events | **No** |
| Family members | **Not captured** |
| Birthday / anniversary dates | **Not captured** |
| Customer preferences (structured) | **Not captured** |
| Lifetime customer value | **Not captured** |
| Events completed per customer | **Not captured** |

### Lead Management Application Fields (Current)

- Customer name
- Phone number
- Event type
- Event date
- Event location (area)
- Budget (if available)
- Notes
- Lead source
- Lead status
- Assigned to

### Search and Lookup

- Customer searchable by **name** and **phone number**
- Each celebration stored as **independent lead**
- **No consolidated customer profile** showing all previous events

### Data Loss Risk

If Zakir's WhatsApp history were lost or unavailable, the business would lose:

- Previous customer conversations
- Design discussions
- Photos and videos shared with customers
- Customer preferences
- Final event address
- Agreed decoration completion time
- Customer feedback
- Informal commitments during discussions
- Historical context for repeat customers

Lead Management Application and Quotation and Billing Application retain operational records, but **much relationship history exists only in WhatsApp**.

---

## Long-Term Relationship Vision (Future)

*Core business philosophy documented in `01-business-vision.md` and `02-business-model.md`. Not operational today.*

### Ideal Relationship

We Decor becomes the family's **preferred celebration partner for every important occasion**.

**Example:** Customer books Haldi today → Event OS remembers customer and celebration → system stores family milestones → before next celebration (e.g. child's birthday three years later) We Decor proactively reaches out → customer does not search for decorator again → previous history, photos, designs, and preferences available → seamless personalized booking.

### Current Reality

After event: relationship inactive; no milestone reminders; no proactive outreach; repeat customers contact We Decor on their own.

### Milestone Data to Remember

Configurable list including:

- Wedding anniversary
- Child's birthday
- Husband's birthday
- Wife's birthday
- Wedding date
- Engagement date
- Baby shower
- Naming ceremony
- Housewarming
- Other recurring family celebrations

### Proactive Outreach Model

| Attribute | Future Design |
|-----------|---------------|
| Reminder generation | **Automatic** — system reminds We Decor before upcoming milestone |
| Customer message | **Team-sent** after reviewing reminder — not fully automated to customer |
| Intent | Remind about upcoming celebration; ask if decoration or event services needed; continue relationship naturally without being intrusive |
| Timing | **Not specified** in interview — to be defined in future document |

### Customer Unit

Long-term relationship built around the **family**, not just an individual. Multiple celebrations over years become part of family's overall history.

### What We Decor Would Never Do

- Spam customers with unnecessary promotional messages
- Contact customers too frequently
- Share or sell customer information
- Use customer data in a way that violates trust

Communication must always be **relevant, respectful, and based on an actual upcoming celebration**.

### Three Data Points to Capture First

1. **Family milestone dates** (birthdays, anniversaries, recurring celebrations)
2. **Structured customer preferences** (design style, colour preferences, budget preferences)
3. **Relationship linkage** — every new celebration connected to same customer/family profile instead of isolated leads

---

## Customer Intelligence Platform

*Future Event OS capability. Founder priorities from interview. Not a generic CRM.*

### Definition

Beyond CRM: a system that links celebrations, milestones, preferences, communications, and payments to a **persistent family profile**—supporting We Decor's "trusted celebration partner for life" strategy.

### Priority Features (Founder-Ranked)

| Priority | Capability | Description |
|----------|------------|-------------|
| **1** | Unified customer and family profile | Every celebration linked to single profile with complete history |
| **2** | Complete customer timeline | One view: enquiries, quotations, events, payments, photos, communication history |
| **3** | Milestone and relationship management | Store recurring celebrations; remind team before upcoming milestones |
| **4** | Communication and follow-up management | Pending follow-ups, communication tracking, due reminders, important discussion records |
| **5** | Customer preferences and event intelligence | Decoration styles, colours, budget preferences, past themes, likes/dislikes — reused for future celebrations |

### Success Definition (Qualitative — Not Metrics)

The platform works when:

- Team immediately recognizes every returning customer
- Every previous celebration available in one place
- No customer information depends on WhatsApp memory
- No important context lost when staff change
- Repeat bookings easier because history and preferences already available
- Team spends less time searching, more time serving
- Customers feel We Decor remembers them and their family without repeating the same questions

---

## Pain Points and Journey Breakpoints

### Customer Pain Points

| Pain Point | Detail |
|------------|--------|
| Quotation wait time | Waiting to receive quotation after initial enquiry |
| Multi-decorator comparison | Comparing multiple decorators before deciding |
| Design uncertainty | Uncertainty until designs are shared |
| Last-minute coordination | Event timing or location changes near event day |
| Repeated information | Having to repeat information if previous conversations difficult to locate |

Customers generally do **not** complain about the overall process — these are areas of **uncertainty**.

### Internal Pain Points

| Pain Point | Detail |
|------------|--------|
| Fragmented data | Information spread across Lead Management Application, Quotation and Billing Application, WhatsApp, Google Drive |
| WhatsApp dependency | Primary source of customer history; difficult to retrieve structured information |
| No repeat profile | Repeat customers have no consolidated profile |
| Manual preferences | Customer preferences remembered by Zakir manually |
| Manual follow-ups | No systematic follow-up workflow |
| No referral tracking | Referral information not captured |
| Photos unlinked | Event photos not linked to customer records |
| Duplicate entry | Multiple applications require duplicate information |
| Key-person memory | Knowledge depends heavily on Zakir's memory |

### Journey Breakpoints

Where the journey most commonly stalls, fails, or becomes inefficient:

| # | Breakpoint |
|---|------------|
| 1 | **Customer evaluation stage** — comparing multiple decorators during In Talks |
| 2 | **Manual follow-up** during In Talks — no fixed cadence; depends on Zakir's judgement |
| 3 | **Loss of customer history** between celebrations — each event is isolated |
| 4 | **Post-event relationship ends** immediately after review request |
| 5 | **Repeat customers treated as new enquiries** within the system |

---

## Customer Journey Rules

*Rules captured during customer journey interview. Extend business rules in `02-business-model.md` (BR-01–31). Full registry planned for `14-business-rules.md`.*

### Intake and Handover

| ID | Rule |
|----|------|
| CJ-01 | Every enquiry is received by Ilyas first regardless of channel |
| CJ-02 | Instagram Ads enquiries are qualified on Instagram DM before WhatsApp handover |
| CJ-03 | Qualification requires: event type, event date, event location, WhatsApp number |
| CJ-04 | Lead is created in Lead Management Application only after qualification details received |
| CJ-05 | Lead is assigned to Zakir before or at WhatsApp handover |
| CJ-06 | Customer is informed that the team will contact them on WhatsApp |
| CJ-07 | Each celebration creates a **new lead** — even for repeat customers |

### Communication

| ID | Rule |
|----|------|
| CJ-08 | Primary customer communication after handover is WhatsApp |
| CJ-09 | Instagram DM is used for qualification only; sales discussion moves to WhatsApp |
| CJ-10 | Only Instagram qualification messages use a standard template today |
| CJ-11 | Zakir usually contacts customer same day after assignment — no formal SLA |
| CJ-12 | Follow-up during In Talks is manual with no fixed cadence |

### Booking and Pre-Event

| ID | Rule |
|----|------|
| CJ-13 | Booking is not reserved until advance payment received (see BR-04) |
| CJ-14 | Full event address and decoration completion time collected after Approved |
| CJ-15 | Pre-event reconfirmation has no fixed timeline — Zakir contacts as event approaches |
| CJ-16 | Scope changes after Approved allowed; quotation updated; customer informed of revised price before proceeding |
| CJ-17 | No formal pre-event checklist or change-order process today |

### Event Day and Post-Event

| ID | Rule |
|----|------|
| CJ-18 | Objective is complete decoration before agreed completion time |
| CJ-19 | No standard event-day status messages (arrived, started, completed) |
| CJ-20 | Balance generally collected after decoration completed; timing varies |
| CJ-21 | Google review requested via WhatsApp after event — no template; timing varies |
| CJ-22 | Event photos not automatically delivered to customers |
| CJ-23 | Customer journey ends after balance collected and review request sent — no further follow-up today |

### Data and Relationship

| ID | Rule |
|----|------|
| CJ-24 | No consolidated customer or family profile exists today |
| CJ-25 | Referral source is not captured in any system |
| CJ-26 | Repeat customers identified informally — not by system flag |
| CJ-27 | Customer preferences exist only in WhatsApp and staff memory |
| CJ-28 | No proactive milestone outreach or re-engagement today |

### Future Rules (Vision — Not Enforced Today)

| ID | Rule |
|----|------|
| CJ-29 | Future: every celebration must link to a customer/family profile |
| CJ-30 | Future: milestone reminders generated automatically; customer outreach sent by team after review |
| CJ-31 | Future: customer communication must be relevant to upcoming celebration — never spam |

---

## Key Metrics

### Metrics Known Today (Customer Journey)

| Metric | Value | Confidence |
|--------|-------|------------|
| Instagram Ads enquiry share | ~80% | Approximate (from `02-business-model.md`) |
| Enquiries per month (ads active) | ~200 | Approximate |
| Overall conversion | ~10% | Approximate |
| Google reviews | 75+ five-star | Known |
| Google review request sent | Usually after event | Practice |
| Google review conversion | Small percentage | Qualitative only |

### Metrics Not Currently Measured (Customer Journey)

| Metric | Why It Matters |
|--------|----------------|
| First-time vs repeat vs referral enquiry mix | Channel and relationship strategy |
| Referral conversion rate | Referral programme ROI |
| Repeat customer rate | Relationship strategy effectiveness |
| Quotation turnaround time | Customer pain point (waiting for quote) |
| Google review request → review conversion | Review growth optimization |
| Customer satisfaction (formal) | North Star measurement |
| Milestone re-engagement rate | Customer Intelligence Platform ROI |
| Lifetime customer value | Family relationship vision ROI |
| Win/loss reasons (why chose We Decor) | Competitive positioning |
| Post-event follow-up effectiveness | Retention loop design |

---

## Software Implications

*Internal product direction for Event OS. Derived from documented customer journey gaps.*

### Priority Modules (Customer Journey)

| Journey Gap | Software Implication | Priority |
|-------------|---------------------|----------|
| No customer/family profile | Customer Intelligence Platform: unified family profile | **Critical (P1)** |
| Disconnected leads per celebration | Link every lead/event to customer/family record | **Critical (P1)** |
| WhatsApp as relationship system of record | Structured communication log linked to profile | **High** |
| No customer timeline | Timeline view: enquiries → quotes → events → payments → photos | **Critical (P1)** |
| No milestone tracking | Configurable milestone registry + team reminders | **High (P3)** |
| No proactive outreach | Reminder workflow: system alert → team review → send message | **High (P3)** |
| Manual follow-up during In Talks | Follow-up task management with due dates and ownership | **High (P4)** |
| No referral tracking | Referral source field + attribution to family profile | **Medium** |
| Photos not linked to customer | Event photo gallery per celebration linked to profile | **Medium** |
| Preferences in memory only | Structured preference capture (style, colours, budget) | **High (P5)** |
| Duplicate data across apps | Lead ↔ Quotation ↔ Payment ↔ Customer integration | **Critical** |
| No review tracking | Google review request status per event/customer | **Low–Medium** |
| No post-event workflow | Optional thank-you, satisfaction, and re-engagement workflows (future) | **Medium (future)** |
| No pre-event checklist | Digital pre-event checklist and change-order workflow | **Medium** |
| No cancellation policy document | Customer-facing cancellation policy + refund workflow | **Medium** |

### Customer Intelligence Platform — Module Boundaries

| Submodule | Responsibility |
|-----------|----------------|
| **Customer / Family Profile** | Persistent identity; family members; contact details |
| **Celebration History** | Linked events across years; not isolated leads |
| **Milestone Registry** | Configurable dates; recurring celebration types |
| **Preference Store** | Design, colour, budget, theme preferences per family |
| **Timeline** | Unified view of all touchpoints and transactions |
| **Outreach Reminders** | System-generated alerts; team-approved customer messages |
| **Communication Log** | Structured record supplementing WhatsApp |

### AI Agent Implications

AI agents operating on customer journey must:

- Treat **family** as the primary relationship unit, not individual leads
- Never invent milestone dates or preferences — only use captured data
- Distinguish **current state** (no proactive outreach) from **future vision**
- Respect CJ-31: outreach only for relevant upcoming celebrations
- Flag when customer history is missing (WhatsApp-only context)

---

## Consistency Review

### Verified Consistent with `01-business-vision.md`

| Topic | Status |
|-------|--------|
| Hassle-free experience definition | ✓ Consistent — customer shares requirements; We Decor handles rest |
| 9-step typical journey (01) | ✓ Extended with 18+ stages; no contradiction |
| Trust won at completed decoration | ✓ Consistent |
| Ilyas intake; Zakir customer/execution | ✓ Consistent |
| WhatsApp-primary operations | ✓ Consistent |
| Repeat customers and referrals significant | ✓ Consistent |
| Lifelong celebration partner vision | ✓ Consistent — 03 adds operational detail and gaps |
| Lead Management Application + Quotation and Billing Application separate | ✓ Consistent |
| 75+ Google reviews | ✓ Consistent |
| Late arrival lesson | ✓ Consistent |

### Verified Consistent with `02-business-model.md`

| Topic | Status |
|-------|--------|
| Pipeline: New → In Talks → Approved → Completed | ✓ Consistent |
| Ilyas intake; Zakir assignment and sales | ✓ Consistent (CJ-01–CJ-06 align with BR-01) |
| Advance ~20%; Approved on payment | ✓ Consistent (BR-04) |
| Instagram Ads ~80% | ✓ Consistent |
| Follow-up reminders in Lead Management Application | ✓ Consistent — manual dates set by Zakir |
| Cancellation refund case-by-case | ✓ Consistent (BR-25–27) |
| No price increase after booking | ✓ Consistent (BR-22, BR-23) |
| Scope changes and revised quotation | ✓ Consistent (BR-24, BR-15) |
| Customer Intelligence Platform strategic priority | ✓ Consistent — 03 defines requirements |
| Repeat/referral conversion not measured | ✓ Consistent |

### Known Cross-Document Notes

| Topic | Note |
|-------|------|
| `02-business-model.md` says customer not asked to repeat at handover | `03` adds pain point: customers may repeat information if conversations hard to locate — **not contradictory** (handover vs repeat customer / lost context) |
| `01-business-vision.md` lists Google Ads as channel | Instagram Ads ~80% per `02` — unchanged |
| Photography "usually" | Not every event — consistent with informal practice |

### Internal Consistency (Within This Document)

| Check | Result |
|-------|--------|
| Lifecycle stages align with channel flows | ✓ |
| Ownership matrix aligns with communication touchpoints | ✓ |
| Data model aligns with pain points | ✓ |
| Future vision clearly separated from current state | ✓ |
| CJ rules align with narrative sections | ✓ |

---

## Document Review & Quality Audit

| Dimension | Score | Rationale |
|-----------|-------|-----------|
| **Business Clarity** | 9.5/10 | Full lifecycle documented stage-by-stage with owner, channel, and frequency |
| **Customer Experience Depth** | 9/10 | Pre-event, event day, and post-event captured from customer perspective |
| **Data Model Completeness** | 9/10 | Field-level storage map; gaps explicitly marked |
| **Future Vision Clarity** | 9/10 | CIP priorities founder-ranked; current vs future clearly separated |
| **SaaS Readiness** | 9.5/10 | Module boundaries, CJ rules, and software implications directly actionable |
| **AI Readiness** | 9.5/10 | AI agent guardrails documented; no invented data rules |

**Overall document quality: 9.5/10**

**Why not 10/10:** Quotation turnaround time, review conversion rate, and proactive outreach timing not measured or specified. Pre-event checklist and post-event workflows intentionally absent today. Some customer journey detail deferred to `04-sales-process.md`, `05-event-execution.md`, and `12-customer-support.md`.

---

## Open Questions

*For future Business Bible documents. Do not invent answers.*

### For `03-customer-journey.md` (If Business Changes)

- Formal Google review request message template
- Target quotation turnaround time
- Pre-event checklist adoption
- Post-event thank-you workflow adoption
- Proactive outreach timing (how many days/weeks before milestone)

### For `04-sales-process.md`

- Structured win/loss reason capture
- Formal follow-up cadence rules
- Quotation delivery SLA
- Lost reason taxonomy during evaluation stage

### For `05-event-execution.md`

- Standard arrival buffer by event type
- Event-day status communication policy
- Formal incident management process
- Setup completion confirmation workflow

### For `12-customer-support.md`

- Complaint handling and escalation
- Negative feedback resolution playbook
- Customer satisfaction survey design

### For `14-business-rules.md`

- Merge CJ-01–31 into master business rules registry
- Formal cancellation policy when documented

### For `15-kpis.md`

- Google review conversion target
- Repeat customer rate target
- Milestone re-engagement rate definition

---

## Document Governance

### Document Owner

**Ilyas** (Co-Founder, We Decor Events) owns this document.

### Primary Reviewer

**Zakir** (Co-Founder, We Decor Events) validates customer-facing and operational accuracy.

### Review Schedule

| Review Type | Frequency |
|-------------|-----------|
| Scheduled review | Every 6 months (Next: 2027-01-07) |
| Triggered review | Within 30 days of material customer journey change |

### Changes Requiring Revision

- New customer communication channels or handover process
- Lead Management Application field or pipeline changes affecting journey
- Adoption of pre-event checklist, post-event workflow, or milestone outreach
- Customer Intelligence Platform go-live (update current vs future sections)
- Formal cancellation or review request policy
- Change to family/customer profile model

### Freeze Policy

**Version 1.0 is frozen.** Do not edit unless the business materially changes. Next planned document: **`04-sales-process.md`**.

---

## Related Documents

### Business Bible

| Document | Relationship |
|----------|--------------|
| [01-business-vision.md](./01-business-vision.md) | **Prerequisite** — strategic vision and customer experience philosophy |
| [02-business-model.md](./02-business-model.md) | **Prerequisite** — sales pipeline, payments, business rules BR-01–31 |
| [04-sales-process.md](./04-sales-process.md) | **Next** — expands In Talks, follow-up, win/loss |
| [05-event-execution.md](./05-event-execution.md) | Expands event day operations |
| [12-customer-support.md](./12-customer-support.md) | Expands complaints and support |
| [14-business-rules.md](./14-business-rules.md) | Master rules registry (CJ-01–31 to merge) |
| [15-kpis.md](./15-kpis.md) | Customer journey KPI definitions |
| [16-pain-points.md](./16-pain-points.md) | Operational pain points in depth |
| [17-automation-opportunities.md](./17-automation-opportunities.md) | Automation from journey breakpoints |

### Engineering Foundation

| Document | Relationship |
|----------|--------------|
| [04-business-domain.md](../04-business-domain.md) | Customer and family domain entities |
| [06-module-design.md](../06-module-design.md) | Customer Intelligence Platform module boundaries |
| [11-roadmap.md](../11-roadmap.md) | Delivery phases for relationship features |

---

*Version 1.0 — Approved*  
*Last updated: 2026-07-07*  
*Source: Founder interview (Ilyas) + editorial review*  
*Next document: [04-sales-process.md](./04-sales-process.md)*
