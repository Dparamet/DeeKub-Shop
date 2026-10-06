# Design: Supabase Auth, Live Catalog, and Order Flow

Date: 2026-10-06

Status: Implementation authorized by the user on 2026-10-06 following the approved architecture

Project: deeKub Ebook Shop

## Goal

Make the storefront easier to use and connect its first customer and admin flows to real persisted data. Supabase provides password authentication and PostgreSQL; the existing Go API remains the business and authorization boundary. The first release stores catalog and orders in Supabase but does not collect real money or call a real game-top-up provider.

## Baseline Before Implementation

- Next.js 16 storefront and `/admin` preview exist. The Admin route is public, and its dashboard and orders are demo data.
- The Go/Gin API has health/readiness endpoints and public catalog reads. It uses `DATABASE_URL` with pgx and embeds SQL migrations.
- PostgreSQL currently has a `products` table and demo seed data. There are no login, role, order, or Admin write endpoints yet.
- Cart checkout is disabled. README mentions Supabase Auth as a target, but the code does not implement it yet.

Existing roadmap context: `tasks/plan.md` and `tasks/todo.md`.

## Approaches Considered

1. **Keep Next.js and Go; add Supabase Auth and Supabase PostgreSQL (recommended).** Reuses the current API and migrations. Go remains the single place that checks roles, ownership, prices, and order transitions.
2. **Call Supabase Data API directly from the browser.** Less Go work initially, but price/order rules and permissions become split between the browser and database policies.
3. **Replace Go endpoints with Supabase Edge Functions.** Reduces the number of backend services but discards the existing Go API and changes the project's planned architecture.

## Recommended Architecture

- Next.js uses Supabase Auth email/password sessions stored in cookies. Use the current Supabase SSR setup and the Next.js 16 `proxy.ts` convention to refresh sessions.
- Browser data requests use same-origin Next.js Route Handlers. Those handlers read the current session and relay the access token to Go; the browser does not connect to PostgreSQL or send database credentials.
- Go verifies Supabase access tokens, loads the caller's role, and checks authorization and order ownership on every protected endpoint. Add `GET /me` to return the verified user ID and role for server-rendered route guards. Public catalog reads remain public; Admin reads and writes require `ADMIN`.
- The Next.js `/admin` server layout checks the session and `/me`: anonymous visitors go to login, authenticated non-admins are denied, and Admin pages do not render before the role check completes.
- Go connects to Supabase PostgreSQL through server-only `DATABASE_URL`. Apply new schema changes as incremental SQL migrations.
- Enable restrictive RLS on exposed application tables as defense in depth. Go's role and ownership checks remain mandatory even when its database connection has elevated database privileges.

## User Flows

### Customer

1. Anyone can browse published products and see clear product type, platform/region, price, and availability.
2. Email/password registration and login use Supabase Auth.
3. Login is required to submit an order and view order history. The API calculates price from the database; it never trusts a client-supplied total.
4. The order and status events are saved in the database. A development-only mock payment/fulfillment path demonstrates success and failure without moving money or contacting a supplier.

### Admin

1. Normal users do not see Admin navigation.
2. An unauthenticated request to `/admin` redirects to login. An authenticated `USER` is denied access; only `ADMIN` sees the Admin workspace.
3. Every Admin API endpoint independently checks `ADMIN`; changing the browser URL or calling the API directly cannot grant access.
4. Admin can create, edit, and publish catalog records and view persisted orders. The first Admin role is assigned through a trusted setup step after that account registers; public signup cannot grant itself `ADMIN`.

Initial scope uses `USER` and `ADMIN`. Add `SUPPORT` when support-only order workflows are implemented.

## Usability Direction

Keep the existing deeKub visual identity. Simplify the customer path with clear categories for top-ups and game keys, readable prices and labels, consistent search/filter controls, and an obvious cart/account action. Keep Admin tasks focused on products and orders, reduce dashboard noise, and preserve mobile and keyboard usability. Do not show demo order metrics as live business data.

## Data and Security Boundaries

- Add role/profile data linked to Supabase Auth user IDs; users cannot write or change their own role.
- Add orders, order items with a price/name snapshot, and order status events. Store money as integer minor units and calculate totals in Go.
- Public catalog queries return published products only. A customer can read only their own orders. Admin endpoints require an Admin role.
- Never place database credentials, a Supabase secret/service-role key, or payment secrets in browser variables, logs, or source control.
- Mock payment and mock fulfillment are development/demo-only and must fail closed in production configuration.
- Do not store or reveal real game keys in this phase.

## Supabase Setup Values

### Simple Local Setup

Keep one local configuration file at the repository root: copy `.env.example` to `.env`. Do not create another env file under `apps/web`. Root dev scripts load `.env` and pass only the variables each process needs: database credentials go to Go; Supabase URL/publishable key and the API URL go to Next.js. `.env` remains git-ignored.

The root `.env` contains:

```env
DATABASE_URL=<Supabase PostgreSQL connection string>
PORT=8080
NEXT_PUBLIC_SUPABASE_URL=<Supabase Project URL>
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=<Supabase publishable or legacy anon key>
DEEKUB_API_URL=http://localhost:8080
WEB_PORT=3000
APP_ENV=development
```

Run `npm run db:migrate` once after configuration, then `npm run dev` to start the Go API and Next.js together. Keep `npm run dev:web` and `npm run dev:api` available for troubleshooting one service at a time. There is no need to start local Docker PostgreSQL when `DATABASE_URL` points to Supabase.

Set these locally; do not paste secrets into chat or commit them:

- Project URL: `NEXT_PUBLIC_SUPABASE_URL` shared by Next.js and Go token verification.
- Publishable key: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` for the public Supabase Auth client. A publishable key is not a substitute for API authorization.
- PostgreSQL URI from Dashboard → Connect: server-only `DATABASE_URL`. Use direct connection when the host supports IPv6, or the session pooler for IPv4-only access.
- Existing Next-to-Go setting: `DEEKUB_API_URL` (local value: `http://localhost:8080`).
- Auth Dashboard URLs for local development: Site URL `http://localhost:3000`; allowed callback `http://localhost:3000/auth/callback`.
- Initial Admin account email. The user chooses and sets their own password through Supabase Auth; no password is requested in chat.
- Optional SMTP settings if email confirmation or password reset must send mail beyond development testing.

No payment-provider credential is needed in this phase. A real payment provider later requires its sandbox/merchant credentials and webhook signing secret. A real top-up supplier requires its API credentials and product/region contract details.

## Delivery Slices

1. **Auth and access control:** login/register/logout, role record/provisioning, protected `/admin`, protected Go routes, and owner checks.
2. **Live catalog and simpler UI:** database-backed Admin catalog create/edit/publish; public catalog shows only published data; simplify customer/Admin navigation and readability.
3. **Persisted order flow:** create orders with server-side price calculation, order history/detail/status, and development-only mock payment/fulfillment transitions.

Keep real payment, real top-up provider integration, real key delivery, and cloud deployment out of this phase.

## Acceptance Criteria

- Supabase email/password login works in local development; sessions survive page navigation and are cleared on logout.
- Anonymous users cannot render `/admin`; signed-in `USER` accounts cannot view Admin pages or invoke Admin APIs; an `ADMIN` can.
- The Admin role cannot be granted by signup input, editable profile fields, or a client-supplied request body.
- Public catalog and Admin catalog changes persist in Supabase PostgreSQL; draft products are not public.
- A signed-in customer can create and view their own persisted order; another customer cannot access it by changing the order ID.
- Price and total are computed by Go from persisted product prices. Mock payment is clearly labelled and unavailable in production configuration.
- Store and Admin pages remain usable at phone and desktop widths, with readable Thai labels and clear loading/error/empty states.
- No database or Supabase secret is exposed to browser bundles or committed files.

## Open Inputs

- The first Admin email has been provided privately; provisioning requires that account to exist and be confirmed in this project's Supabase Auth.
- Whether email confirmation is enabled for the initial local/demo phase; SMTP can be added if needed.
- Payment and fulfillment providers remain undecided and are explicitly deferred.

## References

- [Supabase server-side Auth for Next.js](https://supabase.com/docs/guides/auth/server-side/creating-a-client?framework=nextjs&package-manager=npm&queryGroups=framework&queryGroups=package-manager)
- [Supabase JWT verification](https://supabase.com/docs/guides/auth/jwts)
- [Supabase PostgreSQL connection methods](https://supabase.com/docs/guides/database/connecting-to-postgres)
