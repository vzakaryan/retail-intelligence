# Retail Intelligence — Interactive Demo

Interactive, fully mocked demo of our **Retail Intelligence** product: a helper
for supermarket store managers and head office (Yerevan, 12 stores). It suggests
what to refill, order and mark down; people stay in control and work as they do
today. All data is mocked — there is no backend.

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:5173/retail-intelligence/

Other commands: `npm run build` (type-check + production build into `dist/`),
`npm run preview` (serve the build).

## Deploy

Every push to `main` builds and publishes the site to GitHub Pages
(`.github/workflows/deploy.yml`). In the repo settings, **Pages → Source** must
be set to **GitHub Actions**. The site is served at
`https://vzakaryan.github.io/retail-intelligence/`.

## Stack

React 19 + TypeScript + Vite 7 · Tailwind CSS 4 · React Router 7 (hash routing) ·
react-i18next · Recharts · Lucide icons · Inter / Noto Sans Armenian fonts.

## Project layout

```
src/
  app/            navigation config, demo state (selected store), scope hook
  components/
    layout/       sidebar, top bar, store selector, app layout
    ui/           small shared building blocks (Card, PageHeader, …)
  data/           the mocked world: stores, districts, suppliers, personas
  i18n/           i18next setup + locales/en.json (hy.json for Armenian, later)
  lib/            locale-aware formatters, helpers
  pages/          one component per screen
docs/design-references/
  approved/       approved target designs (PNG + HTML mockup source)
  original/       the client's original inspiration screenshots
```

Rules: no hard-coded UI text (use `t()` and `locales/en.json`); format numbers,
money and dates only via `src/lib/format.ts`; take all numbers from `src/data`.

See [`CLAUDE.md`](CLAUDE.md) for full product context, decisions and progress.
