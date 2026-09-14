# Saksham Goel — Portfolio

A fast, 3D, auto-scrolling portfolio for **film production, post-production & DI, and graphic design**, with a built-in **developer console** to publish work without touching code.

Built with **React + Vite + Three.js (react-three-fiber)** and **Framer Motion**.

---

## Quick start

```bash
npm install     # already done for you
npm run dev     # start the dev server → http://localhost:5173
npm run build   # production build → dist/
npm run preview # preview the production build locally
```

> Node.js is required. This project was set up with Node 24 LTS.

---

## What's on the page

- **Hero** — your name, tagline, and the three pillars (Film / Post / Design).
- **01 · Film Production** — showreel first (featured, full-width), then published work pulled from YouTube.
- **02 · Post Production & DI** — editing & colour reel, then individual edits/grades.
- **03 · Graphic Design** — decks, logos, and posters (image-based).
- **About** — experience timeline, certificates, and client reviews, plus contact.
- **3D background**, **auto-scroll** (pauses on interaction; toggle bottom-right), and reveal-on-scroll animations.

---

## The developer console (publish your own work)

Open it any of these ways:

- Click **Console** in the top-right nav (or the link in the footer).
- Press **Ctrl/Cmd + Shift + K**.
- Visit the site with **`#console`** in the URL.

From there you can **Add / Edit / Delete** projects in any category:

- **YouTube video** — paste the full link *or* the 11-character ID. The thumbnail is fetched automatically.
- **Image** — paste an image URL (for posters, logos, decks).
- Mark an item **Featured** to make it show first, full-width (use this for a showreel).
- **Backup tab** — download/import a JSON of your changes, or reset to defaults.

### ⚠️ Important: where console data lives

Console changes are saved to **this browser's `localStorage`**. That means:

- ✅ Great for managing and previewing your own site.
- ⚠️ Projects you add via the console are **only visible in the browser you added them from** — public visitors won't see them.

**The content everyone sees** is the seed data in [`src/data/seed.js`](src/data/seed.js). Edit that file (then redeploy) to change the baseline site for all visitors. Use the console for quick local additions and backups.

---

## Replacing the placeholder content

1. **Baseline content (public):** edit [`src/data/seed.js`](src/data/seed.js) — projects, categories, certificates, experience, reviews, and your profile/socials all live there. It's heavily commented.
2. **Your showreel:** find the `film-showreel` / `post-reel` items in `seed.js` and set their `youtubeId`.
3. **Graphic design images:** replace the `image:` URLs (the placeholders use Unsplash).

---

## Deploying to Vercel

1. Push this folder to a GitHub repo.
2. On [vercel.com](https://vercel.com) → **New Project** → import the repo.
3. Framework preset auto-detects **Vite**. Build command `npm run build`, output `dist`. Click **Deploy**.

`vercel.json` is already included. (Netlify works too: build `npm run build`, publish `dist`.)

---

## Upgrading to a real cloud console (optional, later)

To make console additions visible to **all** visitors on **every** device, swap `localStorage` for a free backend like **Supabase**:

- Only [`src/data/store.js`](src/data/store.js) needs to change — keep the exported function names (`usePortfolio`, `addProject`, `updateProject`, `deleteProject`, …) and point them at your database instead of `localStorage`.
- Add a simple login gate around the console so only you can publish.
- No UI components need to change.

---

## Tech

| | |
|---|---|
| Framework | React 18 + Vite 5 |
| 3D | three, @react-three/fiber, @react-three/drei |
| Animation | framer-motion |
| Data | localStorage (swappable to Supabase/Firebase) |
