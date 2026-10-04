# Dependencies

Snapshot from `npm outdated` / `npm audit` (2026-10-04). Re-run both before acting.

## Next.js
`next` 16.1.6 → 16.3.8 (same major, low risk). Needs Node ≥ 20.9.

## Safe batch (same major)
- `react`, `react-dom` 19.2.4 → 19.3.0; `@types/react(-dom)` → 19.3.0
- All `@radix-ui/*` packages (minor/patch)
- `firebase` 11.9.1 → 11.10.0
- `genkit`, `@genkit-ai/google-genai`, `@genkit-ai/next` 1.20.0 → 1.42.0; `genkit-cli` → 1.43.0 (large 1.x jump — test the AI flows)
- `react-hook-form` → 7.89.0, `tailwind-merge` → 3.7.0, `tailwindcss` → 3.4.19, `zod` → 3.25.76, `postcss`, `react-icons`, `recharts` → 2.15.4, `dotenv` → 16.6.1, `react-day-picker` → 8.10.2

## Major upgrades (do one at a time)
`firebase` 12 · `tailwindcss` 4 (config format changes) · `zod` 4 (pair with `@hookform/resolvers` 5) · `recharts` 3 · `typescript` 7 · `googleapis` 183 · `lucide-react` 1.x · `date-fns` 4 · `react-day-picker` 10 · `next-themes` 0.4 · `dotenv` 18 · `@types/node` 26.

## Security audit
102 findings (4 critical, 35 high), largely in the Google Cloud/Firebase transitive chain (`websocket-driver`, `retry-request`, `yaml`, …). `npm audit fix` (without `--force`) resolves many; avoid `--force`.

## Upgrade procedure
1. New branch; update Next + safe batch; `npm audit fix`.
2. `npm run typecheck && npm run build`.
3. Smoke test (see `development.md`).
4. PR for review; repeat for each major bump.
