# Chester Guinness Index — Project Context

## Stack

- **Framework**: Next.js 15 (App Router, server components)
- **Database**: Supabase (PostgreSQL + PostgREST + Auth)
- **Supabase client**: `@supabase/ssr` v0.5 — use `createClient()` from `@/lib/supabase/server` (server) or `@/lib/supabase/client` (client)
- **Styling**: Tailwind CSS v3 with custom design tokens (dark pub theme, gold/cream palette)
- **Language**: TypeScript (`ignoreBuildErrors: true` — pre-existing never-type issue with Supabase types, do not fix)
- **Maps**: Google Maps JS API (`@googlemaps/js-api-loader`) + Places API (Nearby Search, Place Details)

## Environment Variables

Located in `.env.local` (never commit):

```
NEXT_PUBLIC_SUPABASE_URL=https://aauvmakxurcqhmcbganu.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<service role key>
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=<google maps key>
DATABASE_URL=postgresql://postgres:[password]@db.aauvmakxurcqhmcbganu.supabase.co:5432/postgres
```

`DATABASE_URL` is required only for `npm run migrate`. Get the password from Supabase Dashboard → Settings → Database → Database password.

## Deployment

- **Production**: Vercel — auto-deploys on push to `main`
- **Local**: `npm run dev` (port 3000). PM2 on port 3001 is a separate local process — not relevant for dev.
- **Build check**: `npm run build` before pushing if in doubt

## Database Migrations

Migrations live in `supabase/migrations/`. Run them with:

```bash
npm run migrate supabase/migrations/<filename>.sql
```

This uses `scripts/run-migration.mjs` which connects via `DATABASE_URL` (direct PostgreSQL, not REST — required for DDL). As a fallback, paste the SQL into **Supabase Dashboard → SQL Editor**.

**Pending / applied migrations:**
- `20260415_rbac.sql` — adds `role` column to `reviewer_profiles`, sets Daniel as admin, adds `added_by` to `pubs`, enables RLS on pubs + reviews

## Key Users

| Person | Role | Auth user_id |
|--------|------|--------------|
| Daniel Siddons | Admin | `47b346f0-2b71-4000-bdc6-43e8ca80bbcc` |

Daniel's email: `daniel.siddons@chesterguinnessindex.com`
Supabase project ref: `aauvmakxurcqhmcbganu`

## Key Files

| File | Purpose |
|------|---------|
| `app/page.tsx` | Homepage — fetches pubs, official leaderboard, avg scores; passes to MapExplorer |
| `app/map-explorer.tsx` | Client component — All Reviews / Official tabs, sidebar pub list, map |
| `app/leaderboard/page.tsx` | Leaderboard page — Public / Official / Reviewers tabs |
| `services/pubs.ts` | Data fetching: `getAllPubs`, `getAvgScoresPerPub`, `getLeaderboard` |
| `services/reviewers.ts` | `getDanielOfficialLeaderboard`, `getReviewerLeaderboard` |
| `hooks/use-pubs.ts` | Client hook — filter/search/select state for pub list |
| `hooks/use-role.ts` | Client hook — fetches `reviewer_profiles.role` for current auth user |
| `components/layout/admin-nav.tsx` | Admin sidebar nav — filters items by role |
| `components/admin/pub-form.tsx` | Add/edit pub form — includes "Pubs Near Me" geolocation |
| `lib/utils.ts` | `getRatingTier(score)` — maps numeric score to tier label |
| `types/index.ts` | Shared TypeScript types (Pub, Review, PubWithReviews, etc.) |
| `types/database.ts` | Auto-generated Supabase DB types |
| `supabase/migrations/` | SQL migration files |
| `scripts/run-migration.mjs` | Migration runner (requires DATABASE_URL) |

## Scoring Formula

Reviews have 5 sub-scores. Each is rated 1–10. `total_score` is the raw sum (max 50).

| Sub-score | Field |
|-----------|-------|
| Pub Ambience 🍺 | `pub_ambience` |
| Staff 🤝 | `staff` |
| Glass 🥛 (auto-scored from M-code) | `glass_pour` |
| La Pinte ⭐ (the Guinness itself) | `la_pinte` |
| Price 💷 (auto-scored from price entry) | `price_score` |

**Rating tiers** (from `getRatingTier` in `lib/utils.ts`):

| Score | Tier |
|-------|------|
| ≥ 46 | Legendary |
| ≥ 41 | Elite |
| ≥ 36 | Strong |
| ≥ 31 | Decent |
| ≥ 21 | Weak |
| < 21 | Avoid |

## Role-Based Access Control

- `reviewer_profiles.role` column: `'admin'` or `'reviewer'` (default)
- Admin: full CRUD on all pubs and reviews, can delete pubs
- Reviewer: can edit/delete only their own reviews and pubs they added (`added_by`)
- `pubs.added_by` UUID references `auth.users.id` — set automatically on pub creation
- Server-side: fetch role via `supabase.from('reviewer_profiles').select('role').eq('user_id', user.id)`
- Client-side: `useRole()` hook from `hooks/use-role.ts`

## Architecture Notes

- **Official tab**: `getDanielOfficialLeaderboard()` joins reviews↔reviewer_profiles in JS (not DB FK) because `reviews.reviewer_id` may reference either `reviewer_profiles.user_id` or `reviewer_profiles.id`. Both are checked.
- **All Reviews tab**: `getAvgScoresPerPub()` computes mean `total_score` across all reviews (official + unofficial) per pub. Homepage overrides `current_score` with this average and recomputes tier.
- **Map pins**: always use All Reviews scores (filteredPubs), not the Official tab scores.
- **Supabase service role key**: can perform CRUD via REST (PostgREST) but **cannot execute DDL**. DDL requires direct PostgreSQL connection via `DATABASE_URL`.
