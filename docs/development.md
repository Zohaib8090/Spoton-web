# Development

## Setup
```bash
npm ci            # .npmrc sets legacy-peer-deps=true
cp .env.example .env   # fill in values
npm run dev
```
Node 20.19+ (Next 16 needs ≥ 20.9; `render.yaml` pins 20.19.0).

## Environment variables
| Var | Used for |
|---|---|
| `YOUTUBE_API_KEY` | Server-side search (YouTube Data API v3) |
| `GEMINI_API_KEY` | Genkit recommendations |
| `NEXT_PUBLIC_FIREBASE_*` (PROJECT_ID, APP_ID, API_KEY, AUTH_DOMAIN, MESSAGING_SENDER_ID, STORAGE_BUCKET) | Firebase client config — **inlined at build time** |
| `KEEP_AWAKE_URL` (optional) | Target of `scripts/keep-awake.js`; defaults to `RENDER_EXTERNAL_URL`, then the live site |

Without the Firebase vars the app still builds and runs, but auth/Firestore are `null` and sign-in shows "Authentication service is not available."

## Scripts
`dev`, `build`, `start` (also launches `scripts/keep-awake.js` in the background), `lint`, `typecheck`, `genkit:dev`, `genkit:watch`.

## Verification checklist (no automated tests)
1. `npm run typecheck`
2. `npm run build`
3. Manual smoke test: log in (email + Google), search, play a YouTube track, queue/next/prev, create a playlist and add a song, open settings, open the lyrics tab.

## Firebase rules
Edit `firestore.rules`, then deploy with the Firebase CLI. Keep the per-user ownership model; `tracks` stays client read-only.
