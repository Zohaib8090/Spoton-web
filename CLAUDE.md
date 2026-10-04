# Spoton Web

Ad-free music and video streaming on top of YouTube. Next.js 16 (App Router) + React 19, Firebase (Auth + Firestore), Genkit/Gemini for recommendations, Tailwind + Radix UI (shadcn-style components).

Docs live in `docs/` — start with `docs/README.md`. Read `docs/gotchas.md` before touching auth, the player, or deployment.

## Commands
- `npm run dev` — dev server
- `npm run typecheck` — `tsc --noEmit` (build also enforces types; `ignoreBuildErrors` is off)
- `npm run build` — production build (Firebase init logs warnings without env vars; that's expected)
- `npm run lint` — `next lint`
- `npm run genkit:dev` — Genkit dev UI for the AI flows
- No test suite exists. Verify with typecheck + build and a manual smoke test.

## Layout
- `src/app/` — routes (`/`, `search`, `library`, `playlist/[id]`, `profile`, `settings`, `login`, `signup`, `whats-new`)
- `src/app/search/actions.ts` — server action: YouTube Data API search (cached, rate-limited)
- `src/context/player-context.tsx` — playback engine and global player state (large; see gotchas)
- `src/components/` — app UI; `src/components/ui/` is shadcn primitives (don't hand-edit casually)
- `src/firebase/` — Firebase init, providers, `useUser`/`useDoc`/`useCollection` hooks, permission-error plumbing
- `src/ai/` — Genkit setup and flows (`personalized-recommendations`, `youtube-lyrics`)
- `firestore.rules` — security rules (per-user ownership)

## Conventions
- Path alias `@/*` → `src/*`. Match surrounding style; keep comments sparse.
- Env vars are listed in `.env.example`. Never commit `.env`; `NEXT_PUBLIC_*` values are baked in at build time.
- `src/firebase/index.ts` `initializeFirebase()` is marked DO NOT MODIFY — leave it alone.
- Firestore writes from UI use the non-blocking helpers in `src/firebase/non-blocking-*.tsx`; errors surface through `errorEmitter` → `FirebaseErrorListener`.
- Develop on the designated feature branch; open a PR rather than pushing to `main`.
