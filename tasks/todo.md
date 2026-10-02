# deeKub — Task Breakdown

Phase 1 is Web Store + CMS only. Tauri Desktop and React Native Mobile are Phase 2; see plan.md.
Status: `feature/deekub-web-mvp` contains the demo storefront/CMS shell plus Go `/health`, `/readyz`, PostgreSQL catalog migrations/seeds, and public catalog endpoints. Web/API wiring, Auth, CMS writes and transactions remain planned.

| # | Task | Acceptance criteria | Verification | Depends on | Likely files/modules | Size |
|---|---|---|---|---|---|---|
| 1 | Foundation (in progress) | Next.js and Go/Gin start locally; `/health` and DB-backed `/readyz` respond; PostgreSQL migration command applies schema/seed; required config fails clearly | Start PostgreSQL, run migrations, call health/readiness; `go test ./...`, `go vet ./...` | — | `apps/web`, `apps/api/cmd`, `apps/api/internal/config`, `apps/api/internal/db`, `compose.yaml` | M |
| 2 | Supabase Auth + roles | Login/register works; USER/SUPPORT/ADMIN stored/verified; protected Go routes reject invalid tokens | Test no token, expired token, each role, and cross-user order access | 1 | `apps/web/auth`, `apps/api/internal/auth`, `apps/api/internal/permissions`, `db/migrations` | M |
| Checkpoint 1 | Foundation | Web/API/DB/auth run locally with role enforcement | Walk login and protected health/profile route | 1–2 | — | — |
| 3 | deeKub design shell + home (demo shell complete) | Dark UI uses Purple/Blue, Cyan accent, success-only Green, 12–16px cards, subtle glow, Inter/Noto Sans Thai; home has hero, catalog and popular top-ups | Review at desktop/mobile web widths; nav links, search/account controls respond | 2 | `apps/web/app/layout`, `apps/web/app/page`, `apps/web/app/globals.css`, `apps/web/components` | M |
| 4 | Catalog + separate detail flows (demo UI and public API complete; Web/API wiring pending) | `GET /products` supports type/search filters; `GET /products/{slug}` returns published details and game-specific account fields; storefront displays product data | API tests cover filtering, invalid type, internal errors and not-found; connect Web and compare both product flows | 3 | `apps/api/internal/catalog`, `apps/api/internal/db/migrations`, `apps/web/components/storefront.tsx`, `apps/web/data/catalog.ts` | M |
| 5 | CMS catalog management | Admin can create/edit/publish products and top-up packages; customers see published products only | CRUD flow; draft hidden; non-admin API calls rejected | 4 | `apps/api/internal/admin/catalog`, `apps/web/app/admin/products`, `apps/web/app/admin/topups`, `db/migrations` | M |
| 6 | Game Key inventory | Admin import/add keys; counts show Total/Available/Reserved/Sold; list masks codes; reveal is authorized and audited | Duplicate key import rejected; unauthorized reveal rejected; no plaintext in list/logs | 5 | `apps/api/internal/keys`, `apps/api/internal/admin/keys`, `apps/web/app/admin/inventory`, `db/migrations` | M |
| Checkpoint 2 | Store + CMS | Home/catalog/two product detail flows/CMS work with demo data | Admin publishes products; customer views each type correctly | 3–6 | — | — |
| 7 | Order creation + validation | API owns price calculation; one order has one product type; top-up order validates player/tag/region | Tampered price, unpublished product, missing/mismatched fields rejected | 5 | `apps/api/internal/orders`, `apps/api/internal/validation`, `apps/web/app/checkout`, `db/migrations` | M |
| 8 | Mock payment | Demo-only payment action transitions order to paid; cannot run in production configuration | Confirm success/fail; tamper order/amount; production startup blocks demo mode | 7 | `apps/api/internal/payments/mock`, `apps/api/internal/orders`, `apps/web/app/checkout` | M |
| 9 | Order state timeline | Every transition stored with timestamp/status; order/payment/fulfillment states are separate | Assert allowed transitions; reject invalid transition; timeline sorted | 8 | `apps/api/internal/orders`, `apps/api/internal/fulfillment`, `apps/web/app/orders`, `db/migrations` | M |
| 10 | Key reservation + delivery | Paid Key order atomically reserves one key; only owner can reveal; key is not returned twice | Concurrent checkout, duplicate payment callback, other-user access, masked admin list | 9 | `apps/api/internal/fulfillment/keys`, `apps/api/internal/keys`, `apps/web/app/orders`, `db/migrations` | M |
| 11 | Mock top-up provider | Admin can set Simulation/Delay/Success or Failure and test connection; paid order creates one job | Simulate success, provider failure and timeout; retries do not duplicate fulfillment | 9 | `apps/api/internal/providers/mock`, `apps/api/internal/fulfillment/topup`, `apps/web/app/admin/providers`, `db/migrations` | M |
| Checkpoint 3 | Purchase + fulfillment | Mock payment -> Key delivery and mock top-up both reach correct end states | Run both flows; verify order timeline and idempotency | 7–11 | — | — |
| 12 | Customer order tracking | History and detail timeline show payment/validation/processing/completed states; failed flow gives clear next steps | Check user ownership, provider-failed state, contact-admin/refund-request actions | 10–11 | `apps/api/internal/orders`, `apps/web/app/account/orders`, `apps/web/app/orders/[id]` | M |
| 13 | CMS Dashboard + failed orders | Cards show Revenue/Orders/Completed/Failed; Recent Orders; Action Required for failed top-ups, low key stock, payment review | Seed mixed statuses; counts reconcile to DB; support can resolve allowed failures | 9–12 | `apps/api/internal/admin/reports`, `apps/api/internal/admin/orders`, `apps/web/app/admin/dashboard`, `apps/web/app/admin/orders` | M |
| 14 | Azure staging + custom domain | Next.js and Go API deploy to Container Apps; PostgreSQL connects; `www` and `api` hostnames use HTTPS | Set budget alert first; check region/cost; verify DNS/TLS/health; clean unused test resources | 1, 13 | `infra/azure`, `ops/deploy`, Azure DNS settings | M |
| 15 | MVP release review | Customer happy path and failure path work; ADMIN/SUPPORT/USER permissions pass; Phase 1 scope documented | Demo script covers Key, mock top-up, failure handling, inventory and dashboard | 12–14 | `ops/demo-checklist`, `docs/roles`, `docs/runbook` | S |
| 16 | Phase 2: Windows app | Tauri app signs in and calls existing API for catalog/order status; no duplicate business rules | Install `.exe`; verify same account/order data as Web | 15 | `apps/desktop`, `src-tauri` | M |
| 17 | Phase 2: Mobile app | Expo app signs in and calls existing API; checkout uses policy-approved design | Android build; verify catalog/order status and store billing review | 15 | `apps/mobile`, `apps/shared/api-client` | M |

## MVP Checkpoint

- [ ] Customer can buy a demo Game Key; stock reserves once; only owner can view it
- [ ] Customer can place a demo top-up; Mock Provider can complete/fail it; retry does not create duplicate fulfillment
- [ ] Order tracking reflects state transitions and gives a recovery path on failure
- [ ] CMS dashboard highlights action items and key stock; roles are enforced by Go API
- [ ] Azure staging, domain, HTTPS and spending limits are reviewed before demo

Do not start Phase 2 before the MVP checkpoint is reviewed. Do not connect real payment/provider until supplier, payment account and live-selling requirements are confirmed.
