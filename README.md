# AI BOS — Frontend (Step 1: Project Setup & Design System)

## What's in this step

- Next.js 14 App Router + TypeScript + Tailwind
- Dark/light theme system (`next-themes`)
- Reusable UI primitives: `Button`, `Card`
- App shell: sidebar + topbar, shared by all authenticated pages
- Route groups: `(auth)` for login/signup, `(dashboard)` for the main app

## Run it

```bash
npm install
cp .env.example .env
npm run dev
```

Open http://localhost:3000 — it redirects to `/dashboard`, which shows
the sidebar/topbar shell with a placeholder page.

## Test checklist

- [ ] `/` redirects to `/dashboard`
- [ ] Sidebar shows AI BOS branding + 4 nav links, active link highlighted
- [ ] Topbar theme toggle switches dark/light instantly, no flash on reload
- [ ] `/documents`, `/chat`, `/analytics` 404 — expected, built in later steps

## Next step

Step 2: Auth UI (login/signup pages, protected route wrapper — mock auth).
