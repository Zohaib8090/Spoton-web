# Deployment

Three configs exist in the repo; the project has been run on Render and Vercel.

## Render (live site: https://spotonmusic.duckdns.org/)
- Blueprint: `render.yaml` (free web service, Node 20.19.0, `npm ci && npm run build`, `npm run start`).
- All secrets use `sync: false`: they are created empty and **must be filled in the Render dashboard**, then redeploy (use "Clear build cache & deploy" after changing `NEXT_PUBLIC_*`).
- The free plan sleeps after inactivity. `scripts/keep-awake.js` pings itself, but a pinger inside the same service can't wake it once asleep — use an external uptime monitor for reliability.
- The old `spoton-web.onrender.com` address returns 404 (`no-server`); use the duckdns domain.

## Vercel
Preview/production builds work with the same env vars set in Project Settings. `.env.vercel*` files are gitignored.

## Firebase App Hosting
`apphosting.yaml` (maxInstances: 1). `initializeFirebase()` is written to support App Hosting's argument-less `initializeApp()`.

## Firebase Auth domain checklist (do this for every new domain)
1. Firebase Console → Authentication → Settings → **Authorized domains**: add the domain. Missing this breaks Google sign-in on that domain only (e.g., Vercel worked while the custom domain failed).
2. If the browser API key is restricted by HTTP referrer in Google Cloud Console, allow `https://<domain>/*`.
3. Google sign-in uses `signInWithPopup`. If you ever switch to `signInWithRedirect`, serve `/__/auth/` from your own origin and set `authDomain` to it — modern browsers block the third-party storage it otherwise relies on.

## After a deploy
Open `/login` and sign in with Google and email, run a search, and play a track.
