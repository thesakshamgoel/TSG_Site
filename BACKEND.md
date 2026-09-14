# Backend setup — login, emailed forms & shared content

Your site works with **zero** setup (local mode). Do the steps below only to turn
on the real backend: a Google login that's just you, reviews/featured picks that
every visitor sees, and forms that email you.

Everything degrades gracefully — if a piece isn't configured, that piece falls
back to the old local behaviour. You can do Part A and B independently.

---

## Part A — Login + shared content (Firebase)

This gives you the **"Sign in with Google" console** (locked to your email) and
stores your edits + review/featured picks in the cloud so all visitors see them.

1. Go to <https://console.firebase.google.com> → **Add project** (any name).
2. In the project, click the **Web** icon `</>` to register a web app. Copy the
   `firebaseConfig` values it shows you.
3. **Build → Authentication → Get started → Sign-in method → Google → Enable.**
   (Set your support email; save.)
4. **Build → Firestore Database → Create database → Production mode.**
5. Open the **Rules** tab and paste the contents of [`firestore.rules`](firestore.rules).
   Publish.
6. In the project, copy `.env.example` to **`.env.local`** and fill in the
   `VITE_FIREBASE_*` values from step 2. Keep `VITE_OWNER_EMAIL` as your Google
   address (`thesakshamgoel@gmail.com`).
7. **Authentication → Settings → Authorized domains** — add the domain you deploy
   to (e.g. `your-site.netlify.app`). `localhost` is allowed by default.
8. Rebuild / restart the dev server. The console now opens with **Sign in with
   Google**, and only your account gets in. Your Curate picks + edits now persist
   for everyone.

**Visitor login (automatic once Firebase is on).** A **Sign in** button appears
in the top-right nav — any Google/Gmail account can sign in, and the avatar chip
that replaces it shows the account menu (and Sign out). Anyone can browse the
site freely, but *starting a project*, *leaving a review*, and *seeing your
direct email/phone* require signing in (any account — only the console is
restricted to yours).

**Owner-only console.** When Firebase is on, the "Developer console" footer link
and the "Developer Console" item in the account menu only render for
`VITE_OWNER_EMAIL`. Other visitors have no console entry point at all (the
`Ctrl/Cmd+Shift+K` / `#console` gate still exists but only your Google account
gets past it). Signed-in visitors get their name/email
prefilled, and review emails include their verified Google account so you know
who sent what. No extra setup — it uses the same Google provider you enabled in
step 3. Without Firebase configured, the site stays fully open as before.

> Firebase's free "Spark" plan is plenty for a portfolio.

## Part B — Emailed forms (Web3Forms)

This emails the **contact** and **review (with rating)** forms to your inbox.

1. Go to <https://web3forms.com>, enter `thesakshamgoel@gmail.com`, and copy the
   **Access Key** they email you.
2. Put it in `.env.local` as `VITE_WEB3FORMS_KEY=...`.
3. Rebuild. Submissions now arrive in your inbox (with a mailto fallback if the
   service is ever unreachable).

---

## Using the console

Open it from the footer **"Developer console"** link (or `Ctrl/Cmd + Shift + K`).

- **Add project / Manage** — your work.
- **Curate** — tick up to **3 featured works** (home reel) and up to **3 display
  reviews** (About section), and paste in new reviews from your emailed
  submissions.
- **Before / After** — the grading slider pairs.
- **Backup** — export/import your content as JSON.

## Deploying

The front-end is a static build (`npm run build` → `dist/`). Deploy `dist/` to
Netlify / Vercel / Cloudflare Pages / GitHub Pages. Add the same `.env.local`
variables in your host's **environment variables** settings so the production
build gets them. No server to run — Firebase and Web3Forms are the backend.
