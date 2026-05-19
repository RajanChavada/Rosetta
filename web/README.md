# Rosetta docs site

Marketing + reference docs for the Rosetta CLI. Lives at `web/` inside the Rosetta repo.

## Run locally

```bash
cd web
npm install
npm run dev   # http://localhost:3000
```

## Build

```bash
npm run build && npm run start
```

## Type-check

```bash
npm run typecheck
```

## Deploy

Configured for Vercel — point the project root at `web/`.

## Structure

- `app/`        — Next.js App Router pages
- `components/` — UI, motion, code, docs, home, nav primitives
- `lib/content/` — typed source-of-truth for commands, IDEs, skills, nav
- `public/`     — demo video, OG image, favicon

## Adding a new command

1. Append a `CommandSpec` entry to `lib/content/commands.ts`.
2. If it belongs to a new group, add a route + `NavGroup` link in `lib/content/nav.ts` and create the page at `app/docs/commands/<group>/page.tsx` (copy any existing group page as a template).
3. The relevant group page renders it automatically.

## Tech stack

- Next.js 15 (App Router) + React 19 + TypeScript 5
- Tailwind CSS 4 with OKLCH design tokens in `app/globals.css`
- Framer Motion 12 for scroll-triggered reveals
- Shiki for build-time syntax highlighting
- Geist Sans + Geist Mono
- Lucide React for icons
