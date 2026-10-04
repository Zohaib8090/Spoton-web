# Gotchas

Things that have bitten (or will bite) people working on this repo.

## Auth / Firebase
- **`NEXT_PUBLIC_*` are build-time.** Changing them in the host dashboard does nothing until you rebuild.
- **New domain ⇒ authorize it in Firebase** (Authorized domains) or Google sign-in fails there. Same code worked on Vercel and failed on the custom domain until the domain was added. See `deployment.md`.
- **`auth` / `firestore` can be `null`.** `initializeFirebase()` swallows init failures so builds don't crash. UI that uses `useAuth()` must check for null; the login/signup pages show "Authentication service is not available" in that case — that message means "Firebase didn't initialize *or isn't allowed here*", not a Firebase outage.
- `initializeFirebase()` is annotated DO NOT MODIFY (App Hosting depends on the argument-less `initializeApp()`).
- Firebase web API keys are public by design, but restrict them by referrer. A full copy of an old key sits in git history (`project_backup.txt`, removed from HEAD).
- Sign-in helpers in `non-blocking-login.tsx` intentionally don't `await`; don't "fix" that without checking callers.

## Search / quota
- `search.list` costs 100 units of a 10,000/day default quota ⇒ ~100 uncached searches/day. Keep the cache; if you add features that search, route them through `searchYoutubeAction`.
- The cache and rate limiter are in-memory per server process, not shared across instances and reset on restart. A `'use server'` file can only export async functions, so keep helpers non-exported.

## Player
- `player-context.tsx` is ~880 lines and owns everything about playback. Changing one effect can break crossfade, EQ, or history. Test YouTube *and* local tracks.
- The 100 ms progress timer only exists for crossfade volume fades and runs only when automix + crossfade > 0. It does not set React state; don't add state updates to it (it would re-render the whole app).
- `navigator.connection.type` (wifi/cellular quality settings) is only available in some Android browsers; elsewhere the app uses the default/"unknown" path.
- YouTube playback uses the IFrame player. Hiding it or stripping ads conflicts with YouTube's API terms — be deliberate about "ad-free" claims and features that separate audio from video.
- Lyrics come from scraped captions and often don't exist; an empty list is normal (an `error` field is set only on fetch failure).

## Build / tooling
- `next.config.ts` no longer ignores TS errors — a type error fails the build.
- `.npmrc` has `legacy-peer-deps=true`, which hides peer conflicts. Re-check after upgrades.
- Firebase logs `auth/invalid-api-key` during `npm run build` when env vars are absent; that's expected locally.
- `patches/jsmediatags+3.9.7.patch` exists but `jsmediatags` isn't a dependency or imported, and there's no `patch-package` postinstall. It's dead weight — remove or wire up.
- No tests, and `npm run lint` uses `next lint`, which may be deprecated in newer Next versions.

## Hosting
- Render free tier sleeps; the in-service keep-awake ping can't wake a sleeping instance.
- `render.yaml` Node pin must stay ≥ 20.9 for Next 16.
