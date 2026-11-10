# Retail Intelligence — Demo UI

> This file is loaded automatically at the start of every Claude Code session.
> It is the single source of truth for project context. **Keep it up to date**
> whenever scope, decisions, or progress change.

## What this project is

An **interactive, fully mocked demo UI** of our Retail Intelligence product, built
to show our **first client** (a supermarket chain) what the product offers.
The goal is to let the client click through and *explore* the product's
capabilities — not to build a production system.

- **No real backend, no real data.** Everything is mocked (generated or static
  JSON) but must look realistic and internally consistent (same stores, SKUs,
  suppliers, dates across all screens).
- **Hosted on GitHub** (repo: `vzakaryan/retail-intelligence`), deployed as a
  static site (GitHub Pages) so the client can open a link.
- **Visual direction** comes from reference screenshots the user provides.
  Approved target design: `docs/design-references/approved/` (see below).

## The product: deep analytics for supermarket chains

Core modules (each will likely become a section/page in the demo):

1. **Demand forecasting & out-of-stock (OOS)**
   - Demand forecasting model per store / SKU.
   - Tracks out-of-stock products.
   - Recommends replenishment quantities.
   - Shows what was missed in a past period (lost sales due to OOS).
   - Shows KPI improvement vs. previous period(s).
2. **Online order fulfillment**
   - Problem: online orders often don't match live on-shelf availability.
   - Product identifies SKUs that usually stock out and generates
     recommendations so the local store manager can focus on refilling shelves
     from the warehouse/backroom before online orders fail.
3. **Excess inventory (overstock)**
   - Current availability per store per SKU.
   - Helps reduce unnecessary inventory and shorten turnover time
     (days of inventory / stock turnover).
4. **Write-offs**
   - Expired, spoiled, and damaged products; trends and root causes.
5. **Supplier efficiency**
   - Supplier performance (e.g. fill rate, on-time delivery, lead time).
6. **Promotions & recommendations**
   - Promotion performance and recommendations.
7. **More modules TBD** — the user will add them over time; record them here.

## Product principles for the MVP (IMPORTANT — keep the demo realistic)

These come from the user's feedback; the client may reject anything that
assumes automation they don't have.

1. **Primary user = the local store manager.** Default view is *one store*
   ("My store today"): numbers, tasks and suggestions at store level, in plain
   language. **Secondary user = head office / area manager** (they buy the
   product): one chain view to compare stores, see results and see how well
   managers act on suggestions.
2. **Semi-automated helper, not automation.** The client still runs most
   processes manually (ordering, shelf refills, markdowns). The product
   **suggests**; the human **decides and acts outside the system**.
   - Never show buttons like "Create order", "Create transfer", or anything
     implying an ERP/supplier integration.
   - Use human-in-the-loop actions: **Accept / Change / Skip** a suggestion,
     **Mark done** a task, **Download order sheet (Excel)**, **Print list**,
     **Mark as sent to supplier**, **Log call**.
   - Always explain *why* a number is suggested (simple, transparent math:
     expected sales + safety stock − in store − on the way).
   - Feedback loop: skipped/changed suggestions ask for a reason; history shows
     past suggestions vs. what happened. This builds trust.
   - Value story: track task completion and KPI improvement since adoption.
3. **Geography: Yerevan only for now.** 12 stores across Yerevan districts.
   Map = schematic Yerevan district map (not Armenia regions).

### Mock world (keep consistent across all screens)
- Chain: "My Supermarket Chain" (client name TBD), 12 stores in Yerevan.
- Personas: **Anna M., manager of Store #03 Arabkir – Komitas** (avatar "AM",
  primary user); **Davit S., Operations, head office** (avatar "DS", chain view).
- Stores: #01 Kentron – Mashtots, #02 Kentron – Tumanyan, #03 Arabkir – Komitas,
  #04 Arabkir – Baghramyan, #05 Nor Nork – Gai, #06 Nor Nork – Vilnius,
  #07 Malatia-Sebastia – Raffi, #08 Shengavit – Bagratunyats, #09 Erebuni,
  #10 Davtashen, #11 Avan, #12 Ajapnyak. (No stores in Kanaker-Zeytun,
  Nork-Marash, Nubarashen.)
- Suppliers (fictional): DairyCo, AgriEggs, BevCo, FreshBake.
- "Today" in the demo = Tue, Nov 10.

## Working agreement (IMPORTANT)

- Work **step by step**. After each step is implemented, **stop, summarize what
  was done, propose the next step, and wait for the user's confirmation** before
  moving on. The user may modify the proposed next step.
- Don't expand scope beyond the confirmed step.
- After each completed step, update the **Progress log** below.
- Commit/push only when the user asks.

## Decisions

| Topic | Decision | Status |
|---|---|---|
| Hosting | GitHub repo + static deploy (GitHub Pages) | Agreed |
| Data | 100% mocked, consistent across screens | Agreed |
| Tech stack | React 19 + TS + Vite 7, Tailwind 4, React Router 7 (hash), react-i18next, Recharts, Lucide | **Agreed 2026-11-10** |
| Client name / branding | — | TBD |
| Target design | `docs/design-references/approved/` (6 screens) | **Approved 2026-11-10** |
| Language | English first, then Armenian + EN/HY switcher; i18n-ready from day one | Agreed |

## Codebase (how the app is built)

- Run: `npm install && npm run dev` → http://localhost:5173/retail-intelligence/ ·
  `npm run build` type-checks and builds to `dist/`. Deploy: push to `main` →
  `.github/workflows/deploy.yml` → GitHub Pages (`base: /retail-intelligence/`).
- Pinned to stable majors on purpose (Vite 7, React Router 7, TS 5.9, i18next 25,
  lucide-react 0.x) — newer majors exist but are avoided for demo stability.
- `src/app/navigation.ts` — single source for sidebar items, routes, badges, and
  whether a screen's design is `approved` or `planned`. Add new screens here.
- `src/app/DemoContext.tsx` — selected store. `src/app/useScope.ts` — "chain"
  on head-office routes (`/stores`), else "store"; drives top bar + persona.
- `src/data/world.ts` — the mocked world (stores, KPIs, districts, suppliers,
  managers, `DEMO_NOW`). All numbers come from here; keep consistent with
  `docs/design-references/approved/`.
- `src/i18n/locales/en.json` — all UI text. `hy.json` empty for now (falls back
  to English); the Հայ switch is disabled until translated. Mock-data text uses
  `Localized {en, hy?}` + `useLocalized()`.
- `src/lib/format.ts` — locale-aware number / % / AMD / pp / date formatters.
- Design tokens live in `src/index.css` (`@theme`), copied from
  `docs/design-references/approved/src/styles.css`.
- Pages not built yet render `src/pages/PlaceholderPage.tsx`.

## Language / i18n

- **Final product language is Armenian.** Build in **English first**, then add
  Armenian with a language switcher (EN / HY).
- Therefore, from day one: **no hard-coded UI strings** — every label goes
  through the i18n layer (English locale file first). Numbers, currency (AMD),
  dates and abbreviations ("M", "B", "pp", "u") must go through locale-aware
  formatters so Armenian can be added without touching components.
- Layouts must tolerate **~30–40% longer text** (Armenian labels are longer)
  — avoid fixed-width labels and truncation of key text.
- Pick a font family with **Armenian script** support (e.g. Noto Sans +
  Noto Sans Armenian) so both languages look consistent.

## Design references

### Approved target design (SOURCE OF TRUTH — build to match these)

Approved by the user on 2026-11-10. Files in `docs/design-references/approved/`.
The HTML/CSS mockup source is in `approved/src/` (`styles.css` holds the design
tokens: colors, radii, type sizes) — reuse it when building the real app.

| File | Screen | User | Key content |
|---|---|---|---|
| `01-my-store-today.png` | My store today (home) | Store manager | 4 store KPIs (this week vs last week), today's tasks with Mark done / Print, online orders at risk, "your results so far", products that may run out today |
| `02-orders-to-place.png` | Order suggestions (list) | Store manager | 3-step "how it works" strip; orders grouped Due today / Coming up / Placed · waiting for delivery; one action per row |
| `03-order-review.png` | One order, step 1: Review quantities | Store manager | Breadcrumb, stepper (Review → Place → Done), needs-review list with quantity box, Why?, Accept / Accept all; reviewed items collapsed; Next disabled until all reviewed |
| `04-order-why-suggestion.png` | "Why?" drawer | Store manager | Transparent math (expected sales + safety stock − in store − on the way), daily sales chart with stockout day, past suggestions vs outcome, Accept / change |
| `05-order-place.png` | One order, step 2: Place the order | Store manager | Final order list; Download Excel / Copy as text / Print; "I've placed the order with <supplier>" + what happens next |
| `06-all-stores-yerevan.png` | All stores · Yerevan | Head office | Chain KPIs incl. "suggestions acted on", schematic Yerevan district tile map, stores ranked by availability, insight "stores that act on suggestions do better" |

Shell (all screens): **left sidebar** with grouped modules (My store today ·
Stock & demand · Inventory health · Partners & sales · Head office), top bar
with store selector, product search, EN / Հայ switch, notifications, user.

### Original inspiration (from the user — superseded)

Files in `docs/design-references/original/`. The user liked the look but found
them too busy; they also assumed chain-level, automated workflows. Use only for
visual inspiration — the approved designs above win on any conflict (e.g. the
top nav was replaced by a sidebar).

| File | Screen | Key content |
|---|---|---|
| `01-executive-overview.png` | Executive Overview | 5 KPI cards, weekly lost sales + availability chart, store comparison, alerts, top risk SKUs, recommended actions |
| `02-store-performance.png` | Store Performance | KPIs, Armenia map by region, branch ranking, alerts, single-store drill-down |
| `03-replenishment-planner.png` | Replenishment Planner | Filters, KPIs, high-priority products, recommendations table, product panel, 14-day forecast, store coverage |

### Design rules learned from the originals

**Keep:**
- Logo "Retail Intelligence — for Supermarket Chains", icons, notifications, user avatar
  (navigation itself moved to a left sidebar in the approved design).
- **Page header**: big title + one-line subtitle, filters/period selector on the right.
- **KPI cards**: icon, label with info tooltip, big value, delta "vs. prior period".
- **Semantic delta colors by meaning, not direction**: red = bad, green = good
  (e.g. Revenue at Risk ▲ is red; Write-offs ▼ is green).
- **Palette**: white/very light gray background, **purple primary** (~#5B3FE0)
  for active nav, primary buttons, charts; soft red/green/amber/blue for status.
- Pill badges for risk %, categories, coverage days; product thumbnails in tables.
- **Insight → action pattern**: alerts and recommendations with clear CTAs
  (Create Order, Create Transfer, Contact Supplier). This is the core story.
- Lucide-style outline icons; rounded cards (~12px radius), subtle borders.
- Context: Armenia, 24 stores (Yerevan, Gyumri, Vanadzor…), currency AMD.

**Change (make it less busy):**
- **One main question per screen.** At most ~4 KPI cards in a row and
  **max 2 content columns** on desktop (references use 3 dense columns).
- **Progressive disclosure**: show a summary first; details (product
  recommendation, store drill-down, explanation text) open in a **side drawer
  or detail page** on click instead of being always visible.
- **Tables**: ~5–6 columns by default, more via expand/row details; generous
  row height; right-aligned numbers; sortable columns.
- **Less color noise**: KPI cards white/neutral with color only on the icon and
  delta (references tint every card background). Use color to signal status, not decoration.
- **Readable type**: body ≥14px, KPI values large, clear hierarchy, more
  whitespace between sections.
- **Fewer, clearer charts**: one message per chart, direct labels, avoid
  dual-axis charts where a simpler view works.
- **Smooth UX**: instant mocked responses, subtle transitions, skeleton states,
  hover tooltips, clickable rows linking between modules (e.g. alert → SKU → store).
- **Consistent mock data** across screens (the references contradict each other,
  e.g. Store #03 availability is 97.9% on one screen and 98.6% on another).

## Progress log

- **Step 1 (2026-11-10):** Created `CLAUDE.md` (agent context) and `README.md`
  (human overview) to persist project context across sessions.
- **Step 2a (2026-11-10):** Added 3 design references, documented what to keep
  and what to simplify, recorded the language/i18n requirement. Tech stack
  proposed, awaiting approval.
- **Step 2b (2026-11-10):** User asked to agree on the look before building.
  Created 4 mockups in `docs/design-proposals/` (HTML in `src/`, rendered
  PNGs via headless Chrome): executive overview, store performance,
  replenishment planner, and the planner with its product detail drawer open. Key changes:
  left sidebar with grouped modules (instead of the top nav, so 9+ modules fit),
  max 4 KPIs and 2 columns, merged alerts and actions into "Needs your attention",
  details in a side drawer, EN/Հայ switch in the top bar. **Awaiting user approval**;
  once approved, move the PNGs to `docs/design-references/` as the target design.
- **Step 2c (2026-11-10):** Redesigned after feedback (store-manager first,
  semi-automated, Yerevan only). New mockups in `docs/design-proposals/`:
  `01-my-store-today`, `02-order-suggestions`, `03-order-suggestion-explained`
  (drawer with the math behind a suggestion), `04-all-stores-yerevan` (head office,
  schematic district map, "suggestions acted on" adoption metric). Removed all
  automated actions.
- **Step 2d (2026-11-10):** User found the order-suggestions screen confusing
  (stacked supplier tabs + status tabs; unclear "Mark as sent"). Redesigned as a
  two-level flow: **Order suggestions list** (orders sorted by deadline: due today /
  coming up / placed, plus a 3-step "how it works" strip) → **one order** with a
  stepper: 1 Review quantities (needs-review list first, reviewed collapsed,
  "Why?" drawer) → 2 Place the order (download Excel / copy text / print, then
  "I've placed the order with <supplier>") → 3 Done. Current mockups:
  `01-my-store-today`, `02-orders-to-place`, `03-order-review`,
  `04-order-why-suggestion`, `05-order-place`, `06-all-stores-yerevan`.
- **Step 2e (2026-11-10):** **User approved the 6 designs.** Moved them (with HTML
  source) to `docs/design-references/approved/`; the client's originals moved to
  `docs/design-references/original/`. `docs/design-proposals/` removed.
  Next proposed step: confirm tech stack, then build the app shell.
- **Step 3 (2026-11-10):** Tech stack agreed. Built the **app shell**: Vite +
  React + TS + Tailwind project, design tokens, Inter/Noto Sans Armenian fonts,
  i18n (English, Armenian switch disabled), locale formatters, mock world
  (12 Yerevan stores, districts, suppliers, managers), sidebar with grouped nav
  and badges, top bar with store / head-office selector, language switch, user;
  responsive (off-canvas menu on small screens); placeholder pages for all routes;
  GitHub Pages workflow. Verified locally (build + click-through desktop/mobile).
  **Not yet committed/pushed; GitHub Pages not yet enabled.**
