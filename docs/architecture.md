# Architecture

## Provider tree
`src/app/layout.tsx` → `AppProvider` (`src/components/app-provider.tsx`):

1. `FirebaseClientProvider` — initializes Firebase, exposes `auth`/`firestore`.
2. `AppContent` — shows `IntroLoader` until `useUser()` resolves, then renders:
3. `ThemeProvider` → `PlayerProvider` → `AppShell` (sidebar/nav + page) plus `PlaybackQueue` sheet and `Toaster`.

The whole app is client-rendered below the layout; most pages are statically prerendered shells.

## Routes
`/` home + personalized recommendations · `/search` · `/library` (playlists, history) · `/playlist/[id]` · `/profile` · `/settings` (playback quality, EQ, transitions, streaming mode) · `/login` · `/signup` · `/whats-new` · `/sitemap.xml`.

## Search
`searchYoutubeAction` (`src/app/search/actions.ts`, server action) calls YouTube Data API v3: `search.list` (100 quota units) then `videos.list` for duration. "Music" mode adds `music` to the query and filters category 10. Titles of the form `Artist - Title` are split into artist/title. Results are cached in memory for 10 minutes (200 entries) and uncached calls are capped at 30/min server-wide. The cache and counter are per-process and reset on restart.

## Player (`src/context/player-context.tsx`)
Single provider that owns playback:
- **YouTube tracks** play through a hidden `react-youtube` iframe (`youtubePlayer`); the full-screen player can show the video.
- **Local/blob tracks** play through an `HTMLAudioElement` routed through Web Audio (10-band EQ, panner).
- Queue, shuffle, loop modes, crossfade/automix (volume fade timer only runs when crossfade is enabled), volume normalization.
- Writes listening history to Firestore and reads user settings from `users/{uid}`.
- Hosts the "Create playlist" dialog and recommendation generation.

## Data model (Firestore)
```
users/{uid}                    profile + settings (playbackQuality, equaliser, trackTransitions, listeningControls, streamingServices)
users/{uid}/history/{id}       listening history (playedAt serverTimestamp)
users/{uid}/playlists/{id}     playlists
users/{uid}/pins/{id}          pinned items
tracks/{id}                    global, read-only from clients
```
Rules (`firestore.rules`) enforce owner-only access; `tracks` is public-read, no client writes. Entity shapes are in `backend.json`; TS types in `src/lib/types.ts`.

## Firebase helpers (`src/firebase/`)
- `index.ts` `initializeFirebase()` tries argument-less `initializeApp()` (App Hosting), falls back to `firebaseConfig` from env, and returns `null` SDKs if both fail (so builds don't crash). Pages must handle `auth === null`.
- `useUser`, `useDoc`, `useCollection` wrap listeners; permission failures are turned into `FirestorePermissionError` and emitted through `errorEmitter`.
- `non-blocking-*` helpers fire writes/sign-ins without awaiting.

## AI (Genkit, `src/ai/`)
- `genkit.ts` — Google AI plugin, model `googleai/gemini-2.5-flash` (needs `GEMINI_API_KEY`).
- `personalized-recommendations` — history strings in, recommended "Artist - Title" strings out.
- `youtube-lyrics` — despite living in the AI folder, uses `youtube-captions-scraper` (no model). Returns `{lyrics, error?}`; empty with `error` set when captions can't be fetched.
