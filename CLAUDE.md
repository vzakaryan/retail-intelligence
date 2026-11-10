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
- Personas: **Anna M., manager of store 03 — Komitas Ave, Arabkir** (avatar "AM",
  primary user); **Davit S., Operations, head office** (avatar "DS", chain view).
- **Store naming (user feedback): never show "#03"-style codes.** A store is
  shown by its street name with the district ("Komitas Ave, Arabkir"); the
  number appears only as a small grey badge (`StoreBadge`) in lists. Use
  `useStoreLabel()` (`name` / `district` / `full`) — don't build names by hand.
- Stores (number · name · district): 01 Mashtots Ave · Kentron, 02 Tumanyan St ·
  Kentron, 03 Komitas Ave · Arabkir, 04 Baghramyan Ave · Arabkir, 05 Gai Ave ·
  Nor Nork, 06 Vilnius St · Nor Nork, 07 Raffi St · Malatia-Sebastia,
  08 Bagratunyats Ave · Shengavit, 09 Erebuni St · Erebuni, 10 Tevosyan St ·
  Davtashen, 11 Khudyakov St · Avan, 12 Halabyan St · Ajapnyak. (No stores in
  Kanaker-Zeytun, Nork-Marash, Nubarashen.)
- Suppliers — **fictional Armenian-style brands** (not real companies, because
  the demo rates them, e.g. one is "Unreliable"): Aragil Dairy / Արագիլ Կաթ
  (id `dairyco`), Nairi Eggs / Նաիրի Ձու (`agrieggs`), Hrazdan Drinks /
  Հրազդան Ըմպելիքներ (`bevco`), Tonir Bakery / Թոնիր Հացատուն (`freshbake`),
  Masis Trade / Մասիս Թրեյդ (`groceryhub`, dry goods), Aragats Frost /
  Արագած Ֆրոստ (`coldfoods`, frozen). Internal ids kept unchanged.
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
| Hosting | Public GitHub repo + GitHub Pages: https://vzakaryan.github.io/retail-intelligence/ | Live |
| Data | 100% mocked, consistent across screens | Agreed |
| Tech stack | React 19 + TS + Vite 7, Tailwind 4, React Router 7 (hash), react-i18next, Recharts, Lucide | **Agreed 2026-11-10** |
| Client name / branding | — | TBD |
| Target design | `docs/design-references/approved/` (18 screens) | **Approved 2026-11-10** |
| Language | English + Armenian, EN / Հայ switch in the top bar (remembered per browser) | **Done 2026-11-10** |

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

- **Both English and Armenian are live.** EN / Հայ switch in the top bar; the
  choice is remembered per browser (`localStorage` key `ri-lang`).
- All UI text lives in `src/i18n/locales/en.json` and `hy.json` (same keys;
  missing hy keys fall back to English). **Every new string must be added to
  both files.** Plural keys (`_one` / `_other`) must exist in hy too.
- Armenian wording uses **retail / accounting terms, not literal translations**:
  դուրսգրում (write-off), ապահովագրական պաշար (safety stock), ավելցուկային
  պաշարներ (overstock), ապրանքի բացակայության ռիսկ (stockout risk), պահեստ (backroom),
  առկայություն դարակում (shelf availability), կորսված վաճառք (lost sales),
  ակցիա (promotion), զեղչ (markdown), հավաքում (order picking), պատվերների
  առաջարկներ (order suggestions), տ.կ. (percentage points).
  **Menu / page names approved by the user:** Ապրանքներ և պահանջարկ (group),
  Ապրանքի բացակայության ռիսկ, Պատվերների առաջարկներ, Պաշարների կարգավիճակ
  (group), Ավելցուկային պաշարներ, Ժամկետանց ապրանքներ (Expiry & write-offs). Punctuation: «»
  quotes, «։» full stop, «՞» on the stressed vowel for questions. Variables are
  placed so they need no case endings (e.g. «{{supplier}}» մատակարարին,
  Լրացնել դարակը՝ {{product}}). "X of Y" is written «Y-ից X-ը».
- Mock-data names are `Localized { en, hy }` (stores, districts, products,
  suppliers, managers, reps). Use `useLocalized()` in components or `pick()` /
  `supplierName()` / `initials()` from `src/lib/names.ts`.
- **Numbers, money and dates for Armenian are formatted by hand** in
  `src/lib/format.ts` (many browsers have no hy-AM locale data and silently
  fall back to US English): decimal comma, narrow space for thousands
  ("1 234,5"), money "1,42 մլն ֏" / "310 հզր ֏", dates "երեքշաբթի, 10 նոյ".
- Layouts are checked for longer Armenian text: sidebar labels wrap, table
  headers wrap, tooltips open toward the page.

## Design references

### Approved target design (SOURCE OF TRUTH — build to match these)

Approved by the user on 2026-11-10 (01–06, 07–10, 11–14, 15–18). Files in `docs/design-references/approved/`.
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
| `07-stockout-risk.png` | Stockout risk | Store manager | KPIs (products at risk, OOS rate, lost sales, forecast accuracy), full-width "products that may run out" grouped Today / Tomorrow with one next step each, OOS-rate trend before vs. with the product, biggest misses last week |
| `08-stockout-product-drawer.png` | Stockout product panel | Store manager | Why it may run out (plain sentence), on shelf / backroom / expected, what-if stock chart, manual steps (refill, call supplier, ask nearby store) → add to today's tasks |
| `09-online-orders.png` | Online orders | Store manager | KPIs, full-width "prepare before picking" checklist, today's delivery slots with at-risk counts, often-missing products with fixes |
| `10-online-orders-slot-drawer.png` | Delivery slot panel | Store manager | Orders at risk in a slot, which fix resolves them, substitute suggestion + "customer contacted" |
| `11-overstock.png` | Overstock | Store manager | KPIs (extra stock value, days of stock vs target, products overstocked, extra stock expiring), full-width "products with too much stock" with one action each, days of stock by category vs target, extra stock value trend |
| `12-overstock-product-drawer.png` | Overstock product panel | Store manager | Why there's too much (plain sentence), sold vs delivered chart, steps: move to another store, order less (order suggestions), promotion |
| `13-expiry-writeoffs.png` | Expiry & write-offs | Store manager | KPIs (write-offs, expiring soon, write-off rate, saved by markdowns), full-width "expiring soon" grouped by day with will-sell / at-risk, write-offs by reason, weekly trend |
| `14-expiry-product-drawer.png` | Expiry product panel | Store manager | Units likely thrown away, normal vs markdown sales chart, steps: markdown (existing task), move to another store, order 0 |
| `15-suppliers.png` | Suppliers | Store manager | KPIs (on time, in full, late deliveries, cost of late deliveries), supplier table least reliable first, recent deliveries, AgriEggs vs others on-time trend |
| `16-supplier-drawer.png` | Supplier panel | Store manager | Late/short summary + cost, last 8 deliveries chart, steps: log call, keep extra safety stock (order-suggestion setting), copy summary for head office |
| `17-promotions.png` | Promotions | Store manager | Promotions set by head office; KPIs, coming-up table with readiness, running now, did past promotions pay off |
| `18-promotion-drawer.png` | Promotion panel | Store manager | Expected uplift, normal vs promotion chart, get-ready steps (order extra in supplier order, price tags task, clear space) |

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
  First commit `43d1acc` pushed to `main` (2026-11-10). Pages was blocked while
  the repo was private (plan limit), so **the user made the repo public** and
  Pages was enabled with GitHub Actions as source.
  **Live demo: https://vzakaryan.github.io/retail-intelligence/** (auto-deploys on
  every push to `main`). Note: the repo is public — never commit client names,
  real data or secrets.
- **Step 4 (2026-11-10):** Built **My store today** (`src/pages/today/`) to match
  `approved/01-my-store-today.png`. Data in `src/data/today.ts` (Store #03
  hand-crafted; other stores derived deterministically) + `src/data/products.ts`.
  Interactive: Mark done / Log call / un-tick tasks (state in `DemoContext`,
  memory only — reload resets the demo), progress + sidebar badge update live,
  refilled products turn green in "Online orders" and "may run out" table,
  Show more tasks, This week / Last 4 weeks switch, Review → Order suggestions,
  Print today's list. Shared UI added in `src/components/ui/` (KpiCard, Pill,
  Tag, Button, IconTile, InfoTip, Progress, Segmented, ProductThumb).
  Small deviation from the mockup: the period dropdowns became one
  This week / Last 4 weeks switch.
- **Step 5 (2026-11-10):** Built the **Order suggestions** flow
  (`src/pages/orders/`) matching approved 02–05. Routes: `/orders` (list),
  `/orders/:orderId` (1 Review), `/orders/:orderId/place` (2 Place),
  `/orders/:orderId/done` (3 Done / view a placed order). Data:
  `src/data/orders.ts` (suggested = expected + safety − in store − on the way;
  Store #03 hand-crafted: DairyCo 14 lines with 6 pre-reviewed, FreshBake,
  BevCo, placed AgriEggs (late) + BevCo; other stores derived) and prices in
  `products.ts`. State in `DemoContext` (line reviews, placed orders, "how it
  works" dismissed) via `useOrders`/`useOrder`. Interactions: edit qty,
  Accept / Accept all, changed qty asks a reason (dialog), Why? drawer with
  calculation + daily sales chart (Recharts) + past suggestions, reviewed list
  with Edit, Next disabled until all reviewed, Download order sheet (CSV that
  opens in Excel), Copy as text, Print, "I've placed the order" → Done.
  Placing an order completes its "Review the … order" task on My store today;
  Log call on a late order completes the call task; sidebar badges update.
- **Step 6 (2026-11-10):** Built **All stores · Yerevan** (`src/pages/stores/`)
  matching approved 06. Chain KPIs computed from `STORES` (`chainKpis`,
  deltas in `CHAIN_DELTAS`), clickable schematic district tile map (filters
  the table), "stores that act on suggestions do better" insight
  (`adoptionInsight`, threshold `HIGH_ADOPTION_PCT` = 85), sortable ranking
  table (lowest availability first), Export (CSV), click a store → its
  "My store today". `fmtAmd(v, { fixed: true })` for aligned table amounts.
  **All 6 approved screens are now built.** Remaining modules (Stockout risk,
  Online orders, Overstock, Expiry & write-offs, Suppliers, Promotions,
  Settings, Help) are placeholders — their designs must be agreed first.
- **Step 6b (2026-11-10):** Fixes from user review: district names kept inside
  map tiles (Nubarashen spans 2 columns, safe wrapping); store names changed
  from "#03 Arabkir – Komitas" to "Komitas Ave, Arabkir" with a number badge.
- **Step 7 (2026-11-10):** Mockups for the next two modules in
  `docs/design-proposals/` (HTML in `src/`, PNGs rendered with headless Chrome):
  `07-stockout-risk`, `08-stockout-product-drawer`, `09-online-orders`,
  `10-online-orders-slot-drawer`. Layout rule applied: the main action table is
  full width; secondary cards sit side by side below (avoids cramped columns).
  **Approved** by the user and moved to `design-references/approved/`.
- **Step 8 (2026-11-10):** Built **Stockout risk** (`src/pages/stockouts/`,
  data `src/data/stockouts.ts`) and **Online orders** (`src/pages/online/`,
  data `src/data/online.ts`) matching approved 07–10.
  - Stockout risk: 3 / 7-day switch, rows grouped Today / Tomorrow / In 2–3 days
    / Later this week, product drawer with plain-language reason, what-if stock
    chart and steps (existing task, log call, add task, covered by order → link).
  - Online orders: Today / Tomorrow switch, "prepare before picking" checklist,
    delivery slots (at-risk counts update live), slot drawer (best fix,
    substitute + "customer contacted"), often-missing with "Add to tasks".
  - **One task per suggestion:** suggestions on these screens map to tasks on
    "My store today" via `useTaskActions` (`find` / `add` / `complete`) with
    deterministic ids (`newTaskId`) or a link to an existing task (e.g. the eggs
    refill). Added tasks live in `DemoContext.addedTasks`; contacted customers
    in `contactedOrders`. New task kinds: askStore, askSupplier, moveToShelf,
    setAside, weekendAside.
  Remaining placeholders: Overstock, Expiry & write-offs, Suppliers, Promotions,
  Settings, Help (designs to be agreed first).
- **Step 9 (2026-11-10):** Mockups for **Overstock** and **Expiry & write-offs**
  in `docs/design-proposals/`: `11-overstock`, `12-overstock-product-drawer`,
  `13-expiry-writeoffs`, `14-expiry-product-drawer`. Same layout rule (full-width
  action table, two cards below), same "one next step + panel with manual
  steps" pattern; mock world extended with dry-goods / frozen products
  (fictional suppliers GroceryHub, ColdFoods). **Approved** and filed in
  `design-references/approved/`.
- **Step 10 (2026-11-10):** Built **Overstock** (`src/pages/overstock/`, data
  `src/data/overstock.ts`) and **Expiry & write-offs** (`src/pages/expiry/`,
  data `src/data/expiry.ts`) matching approved 11–14.
  - Overstock: category filter, KPIs computed from rows (extra value, count,
    expiring extra stock → link to Expiry), table by extra value, days of stock
    by category vs target, extra-value trend, product panel (reason, sold vs
    delivered chart, steps).
  - Expiry: 3 / 7-day switch, rows grouped Today / Tomorrow / In 2 / In 3 days /
    Later, will-sell and at-risk value, handled rows in green, reasons card,
    write-off trend, product panel (normal vs markdown sales, steps).
  - Shared: `StepList` / `StepsFooter` (`src/pages/stockouts/StepList.tsx`) used by
    all product panels; new step kind `orderLess` (links to the supplier order);
    new task kinds sendToStore, promotion, frontOfShelf; `BeforeAfterChart` and
    `HBar` UI components; `fmtAmd(v, { thousands: true })` for table columns.
  - The same suggestion is one task across screens (e.g. yogurt markdown and
    "move 10 yogurt to Baghramyan Ave" on Overstock, Expiry and My store today).
  Overstock KPIs now come from the rows (AMD 0.41M across 10 products) rather
  than the mockup's illustrative AMD 3.4M / 18 products.
  Remaining placeholders: Suppliers, Promotions, Settings, Help.
- **Step 11 (2026-11-10):** Mockups for **Suppliers** and **Promotions** in
  `docs/design-proposals/`: `15-suppliers`, `16-supplier-drawer`,
  `17-promotions`, `18-promotion-drawer`. Suppliers: on-time / in-full / late /
  cost of late deliveries, supplier table (least reliable first), recent
  deliveries, AgriEggs vs others trend; panel with call, extra safety stock,
  copy summary for head office. Promotions: promotions are **set by head
  office**, the store prepares — coming-up table with "Ready?" steps, running
  now, did past promotions pay off; panel with expected uplift chart and
  get-ready steps (order +160 milk already in DairyCo suggestion, price tags
  task, clear fridge space). **Approved** and filed in `design-references/approved/`.
- **Step 12 (2026-11-10):** Built **Suppliers** (`src/pages/suppliers/`, data
  `src/data/suppliers.ts`) and **Promotions** (`src/pages/promotions/`, data
  `src/data/promotions.ts`) matching approved 15–18. **All 6 product modules
  are now built.**
  - Suppliers: KPIs computed from supplier rows, table least reliable first,
    recent deliveries, worst supplier vs others trend; supplier panel with
    log call / ask-for-earlier-delivery task, **"keep 1 extra day of safety
    stock"** (`DemoContext.extraSafety`) which really raises that supplier's
    order suggestions (`useOrders` → `extraSafety` on each line, shown in the
    review reason and the Why? calculation), and "Copy" summary for head office.
  - Promotions: set by head office; coming-up table with live readiness
    (`usePromoReadiness`: order-suggestion steps count as done, task steps when
    ticked off), running now, did past promotions pay off; panel with uplift
    chart and get-ready steps. New step kinds `orderExtra` and `note`; new task
    kind `clearSpace`; `existing` steps may have no product (price tags task).
  Remaining placeholders: Settings, Help.
- **Step 13 (2026-11-10):** **Armenian translation** done (`hy.json`, 811 strings,
  checked key-by-key and placeholder-by-placeholder against `en.json`) with
  retail terminology; Armenian names for stores, districts, products, managers;
  suppliers renamed to fictional Armenian-style brands; hand-made Armenian
  number / money / date formatting; layout fixes for longer text. Switch is
  live and remembered per browser.
- **Step 13b (2026-11-10):** User's terminology corrections applied to menu,
  page titles and related links/text (see "Menu / page names approved" above).
