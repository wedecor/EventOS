# UI Design System

## Purpose of This Document

This document defines the visual language, component standards, interaction patterns, and UX principles for Event OS. A consistent design system ensures the product feels cohesive, professional, and purpose-built for event management professionals.

---

## Design Philosophy

### Built for Operators, Not Developers

Event OS users are event managers, coordinators, and salespeople—not software engineers. The interface must be:

- **Obvious** — Core actions visible without exploration
- **Fast** — Minimum clicks to complete common tasks
- **Forgiving** — Undo, confirmation dialogs for destructive actions, clear error messages
- **Dense where needed** — Pipeline views and dashboards show information-rich layouts; forms are spacious

### Professional, Not Generic

Event OS should feel like a premium business tool, not a Bootstrap template. The visual identity reflects the elegance of the events industry while maintaining operational clarity.

### Mobile-Aware, Desktop-First

Primary usage is on desktop/laptop in office environments. Mobile support via responsive design and PWA, but layouts are optimized for screens ≥ 1280px wide.

---

## Visual Identity

### Color Palette

```
Primary (Brand)
├── primary-50:   #EEF2FF    (backgrounds, hover)
├── primary-100:  #E0E7FF
├── primary-500:  #6366F1    (buttons, links, active states)
├── primary-600:  #4F46E5    (button hover)
├── primary-700:  #4338CA    (button active)
└── primary-900:  #312E81    (headings)

Neutral
├── gray-50:      #F9FAFB    (page background)
├── gray-100:     #F3F4F6    (card background, dividers)
├── gray-200:     #E5E7EB    (borders)
├── gray-400:     #9CA3AF    (placeholder text)
├── gray-600:     #4B5563    (secondary text)
├── gray-900:     #111827    (primary text)

Semantic
├── success-500:  #22C55E    (completed, approved, paid)
├── warning-500:  #F59E0B    (pending, expiring, attention)
├── error-500:    #EF4444    (errors, overdue, lost)
├── info-500:     #3B82F6    (informational, new)

Pipeline Stage Colors
├── new:          #3B82F6    (blue)
├── contacted:    #8B5CF6    (purple)
├── qualified:    #06B6D4    (cyan)
├── site_visit:   #F59E0B    (amber)
├── quoted:       #F97316    (orange)
├── won:          #22C55E    (green)
├── lost:         #EF4444    (red)
```

**Why these colors:** Indigo primary conveys professionalism and trust. Semantic colors follow universal conventions (green = good, red = bad). Pipeline stage colors are distinct and memorable for quick visual scanning.

### Typography

| Element | Font | Size | Weight | Line Height |
|---------|------|------|--------|-------------|
| Page title | Inter | 24px (1.5rem) | 600 (semibold) | 1.3 |
| Section heading | Inter | 18px (1.125rem) | 600 | 1.4 |
| Card title | Inter | 16px (1rem) | 600 | 1.5 |
| Body text | Inter | 14px (0.875rem) | 400 (regular) | 1.5 |
| Small / caption | Inter | 12px (0.75rem) | 400 | 1.4 |
| Table header | Inter | 12px (0.75rem) | 500 (medium) | 1.4 |
| Table cell | Inter | 14px (0.875rem) | 400 | 1.5 |
| Button | Inter | 14px (0.875rem) | 500 | 1 |
| Money values | Inter (tabular nums) | 14px | 500 | 1.5 |

**Font:** Inter — clean, highly legible, excellent tabular number support for financial data. System font fallback: `-apple-system, BlinkMacSystemFont, sans-serif`.

### Spacing Scale

Based on 4px grid:

| Token | Value | Usage |
|-------|-------|-------|
| `space-1` | 4px | Tight gaps (icon + text) |
| `space-2` | 8px | Inner padding (badges, chips) |
| `space-3` | 12px | Form field gaps |
| `space-4` | 16px | Card padding, section gaps |
| `space-6` | 24px | Between sections |
| `space-8` | 32px | Page padding |
| `space-12` | 48px | Major section separation |

### Border Radius

| Token | Value | Usage |
|-------|-------|-------|
| `rounded-sm` | 4px | Badges, chips |
| `rounded` | 6px | Buttons, inputs |
| `rounded-md` | 8px | Cards, modals |
| `rounded-lg` | 12px | Large cards, panels |
| `rounded-full` | 9999px | Avatars, status dots |

### Shadows

| Token | Usage |
|-------|-------|
| `shadow-sm` | Cards at rest |
| `shadow` | Dropdowns, popovers |
| `shadow-md` | Modals, floating panels |
| `shadow-lg` | Command palette, AI assistant panel |

---

## Layout System

### App Shell

```
┌──────────────────────────────────────────────────────────────┐
│  Header (56px)                                               │
│  [Logo] [Search]                    [Notifications] [User]   │
├────────┬─────────────────────────────────────────────────────┤
│        │                                                     │
│ Side   │  Main Content Area                                  │
│ bar    │                                                     │
│ (240px)│  ┌─────────────────────────────────────────────┐     │
│        │  │  Page Header + Actions                       │     │
│ [Nav]  │  ├─────────────────────────────────────────────┤     │
│ [Nav]  │  │                                             │     │
│ [Nav]  │  │  Page Content                               │     │
│ [Nav]  │  │                                             │     │
│ [Nav]  │  │                                             │     │
│        │  └─────────────────────────────────────────────┘     │
│        │                                                     │
└────────┴─────────────────────────────────────────────────────┘
```

- **Sidebar:** Collapsible to 64px (icons only) on smaller screens
- **Header:** Fixed, always visible
- **Content area:** Scrollable, max-width none (use full width for data-dense views like pipeline)
- **Page header:** Title + primary action button(s) right-aligned

### Navigation Structure

```
├── Dashboard
├── CRM
│   └── Clients
├── Leads
│   └── Pipeline
├── Quotations
├── Bookings
├── Calendar
├── Tasks
├── Operations (Phase 2)
│   ├── Staff
│   ├── Vendors
│   └── Inventory
├── Finance (Phase 3)
│   ├── Invoices
│   ├── Payments
│   └── Expenses
├── Reports (Phase 3)
├── Marketing (Phase 4)
├── Settings
│   ├── General
│   ├── Team
│   ├── Templates
│   └── Integrations
└── AI Assistant (floating)
```

Navigation items appear based on user role permissions. Users only see modules they can access.

---

## Component Library

Built on **shadcn/ui** (or equivalent) with Tailwind CSS. Components are copied into the project (not installed as a dependency) for full customization.

### Core Components

| Component | Usage | Notes |
|-----------|-------|-------|
| **Button** | Primary actions | Variants: primary, secondary, outline, ghost, destructive |
| **Input** | Text entry | With label, error state, helper text |
| **Select** | Single choice from list | Searchable for long lists |
| **Combobox** | Searchable select with create | Client search, staff assignment |
| **DatePicker** | Date and date range selection | Event dates, due dates |
| **Textarea** | Multi-line text | Notes, descriptions |
| **Checkbox** | Boolean toggle | Filters, bulk selection |
| **Switch** | On/off toggle | Settings, feature flags |
| **Badge** | Status indicators | Lead stage, quotation status, task priority |
| **Avatar** | User/staff representation | Initials fallback, image |
| **Card** | Content container | Default layout unit |
| **Dialog** | Modal interactions | Confirmations, quick forms |
| **Sheet** | Side panel | Detail views (lead detail, quotation preview) |
| **Dropdown Menu** | Action menus | Row actions, bulk actions |
| **Tabs** | Section switching | Detail page sections |
| **Table (DataTable)** | Data lists | Sortable, filterable, paginated |
| **Toast** | Feedback notifications | Success, error, info messages |
| **Skeleton** | Loading placeholder | Match layout of loaded content |
| **Empty State** | No data view | Illustration + message + CTA |
| **Command** | Command palette (⌘K) | Quick navigation and search |

### Domain-Specific Components

| Component | Usage |
|-----------|-------|
| **PipelineBoard** | Kanban-style lead pipeline with drag-and-drop stage transitions |
| **LeadCard** | Compact lead summary in pipeline column |
| **QuotationBuilder** | Line item editor with package selection and AI suggestions |
| **CalendarView** | Month/week/day calendar with event entries |
| **MoneyDisplay** | Formatted currency with locale support |
| **StatusBadge** | Color-coded status for leads, quotations, bookings, tasks, invoices |
| **TimelineView** | Activity timeline for client/lead history |
| **AiSuggestionPanel** | Review and accept/reject AI suggestions |
| **StatCard** | Dashboard metric with label, value, and trend indicator |
| **EntityPicker** | Search and select clients, staff, vendors with autocomplete |

---

## Interaction Patterns

### List → Detail → Edit

The primary navigation pattern for all entities:

```
List View (table or pipeline)
  → Click row/card → Detail Sheet (side panel)
    → Click Edit → Edit Form (inline or modal)
    → Save → Back to Detail Sheet (updated)
```

Users should never lose context when viewing details. Side panels (sheets) preserve the list view behind them.

### Create Flow

```
List View → "Create" button → Create Form (full page or large modal)
  → Fill fields → Save → Redirect to Detail View of created entity
```

Create forms for complex entities (quotation, booking) use multi-step or sectioned layouts.

### Destructive Actions

```
User clicks Delete/Cancel → Confirmation Dialog
  → "Are you sure? This action cannot be undone."
  → [Cancel] [Delete (destructive button)]
  → On confirm: action executes, toast confirms
```

All destructive actions require explicit confirmation. No undo for delete; soft delete in database.

### Bulk Actions

```
List View → Select rows (checkbox) → Bulk action bar appears
  → Choose action (assign, change stage, delete) → Confirm → Execute
```

### AI Interaction

```
User clicks "AI Suggest" → Loading indicator in suggestion panel
  → AI suggestions appear in review panel
  → User can: Accept All | Accept Individual | Edit | Reject
  → Accepted items applied to form/entity
  → Toast: "3 line items added from AI suggestion"
```

---

## Page Templates

### Dashboard

```
┌─────────────────────────────────────────────────────┐
│  Dashboard                            [Date Range ▾] │
├──────────┬──────────┬──────────┬──────────────────┤
│  Leads   │  Quotes  │  Events  │  Revenue         │
│  24 new  │  8 sent  │  5 this  │  ₹12.4L          │
│  ↑ 12%   │  3 exp.  │  week    │  ↑ 8%            │
├──────────┴──────────┴──────────┴──────────────────┤
│  Lead Pipeline (mini)          │  Upcoming Events  │
│  [visual pipeline summary]     │  [event list]     │
├────────────────────────────────┼───────────────────┤
│  Tasks Due Today               │  AI Insights      │
│  [task list]                   │  [suggestions]    │
└────────────────────────────────┴───────────────────┘
```

### List Page

```
┌─────────────────────────────────────────────────────┐
│  Leads                              [+ Create Lead]  │
├─────────────────────────────────────────────────────┤
│  [Search...] [Stage ▾] [Assigned ▾] [Source ▾]     │
├─────────────────────────────────────────────────────┤
│  ☐ │ Name          │ Event    │ Stage    │ Assigned │
│  ☐ │ Rajesh Kumar  │ Wedding  │ Quoted   │ Priya    │
│  ☐ │ TechCorp      │ Corporate│ Qualified│ Amit     │
│  ☐ │ ...           │          │          │          │
├─────────────────────────────────────────────────────┤
│  Showing 1-20 of 156              [< 1 2 3 ... 8 >]│
└─────────────────────────────────────────────────────┘
```

### Detail Page (Sheet)

```
┌──────────────────────────────┐
│  ← Back    Rajesh Kumar      │
│  Wedding • Dec 15, 2026      │
│  Stage: [Quoted ▾]           │
├──────────────────────────────┤
│  [Details] [Activity] [Quotes]│
├──────────────────────────────┤
│  Contact: +91 98765 43210    │
│  Email: rajesh@email.com     │
│  Source: Instagram           │
│  Budget: ₹5,00,000           │
│  Assigned: Priya Sharma      │
│                              │
│  Notes:                      │
│  Looking for premium decor...│
├──────────────────────────────┤
│  [Create Quotation]          │
│  [Schedule Site Visit]       │
└──────────────────────────────┘
```

---

## Responsive Behavior

| Breakpoint | Width | Layout |
|------------|-------|--------|
| `sm` | ≥ 640px | Single column, stacked cards |
| `md` | ≥ 768px | Sidebar collapses to icons |
| `lg` | ≥ 1024px | Full sidebar, two-column layouts |
| `xl` | ≥ 1280px | Full layout, pipeline board visible |
| `2xl` | ≥ 1536px | Maximum content width with padding |

Pipeline board: horizontal scroll on `md`, full columns on `xl+`.
Tables: horizontal scroll on small screens; card view alternative on `sm`.

---

## Accessibility

| Requirement | Standard |
|-------------|----------|
| Color contrast | WCAG 2.1 AA (4.5:1 for text, 3:1 for large text) |
| Keyboard navigation | All interactive elements focusable and operable |
| Screen reader | Semantic HTML, ARIA labels on icons and dynamic content |
| Focus indicators | Visible focus ring on all interactive elements |
| Motion | Respect `prefers-reduced-motion`; no essential info in animation |
| Form labels | All inputs have associated labels (not placeholder-only) |
| Error identification | Errors linked to fields via `aria-describedby` |

---

## Iconography

- **Library:** Lucide Icons (consistent, open-source, React-native)
- **Size:** 16px (inline), 20px (navigation), 24px (standalone)
- **Style:** Outlined (not filled) for consistency with clean aesthetic
- **Usage:** Icons always paired with text labels in navigation; icon-only buttons require `aria-label`

---

## Motion and Animation

| Animation | Duration | Easing | Usage |
|-----------|----------|--------|-------|
| Fade in | 150ms | ease-out | Content appearing |
| Slide in (sheet) | 250ms | ease-out | Detail panel open |
| Skeleton pulse | 1.5s loop | ease-in-out | Loading state |
| Toast enter/exit | 200ms | ease-out | Notifications |
| Pipeline drag | 0ms (instant) | — | Drag-and-drop (no animation during drag) |

Keep animations subtle and functional. No decorative animation.

---

## Empty States

Every list/view has a designed empty state:

```
┌─────────────────────────────────┐
│                                 │
│        [Illustration]           │
│                                 │
│     No leads yet                │
│     Create your first lead to   │
│     start building your pipeline│
│                                 │
│     [+ Create Lead]             │
│                                 │
└─────────────────────────────────┘
```

- Illustration: simple, on-brand line art (not stock photos)
- Message: specific to the context (not generic "No data")
- CTA: primary action to resolve the empty state

---

## Dark Mode (Phase 2)

- Architecture supports dark mode via CSS variables
- Not implemented in Phase 1 (focus on core functionality)
- Tailwind `dark:` classes used when implemented
- User preference stored in local storage

---

## Tenant Branding (Phase 6)

Multi-tenant phase supports per-tenant customization:

- Logo in sidebar and header
- Primary color override (CSS variables)
- Favicon
- Email template branding

Architecture: CSS variables set at app initialization from tenant settings.

---

## Related Documents

| Document | Topic |
|----------|-------|
| [02-product-vision.md](./02-product-vision.md) | User personas and journeys |
| [08-coding-standards.md](./08-coding-standards.md) | Frontend coding standards |
| [10-folder-structure.md](./10-folder-structure.md) | Component file organization |
| [18-api-standards.md](./18-api-standards.md) | API driving UI data patterns |

---

*Last updated: 2026-07-06*
*Owner: Product & Engineering*
