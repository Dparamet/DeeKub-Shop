# Light/Dark and shop usability — 2026-10-06

## Implemented

- Light/dark semantic colors apply to the storefront, auth forms, cart, account/orders and admin. Publisher artwork keeps its original colors.
- Sun/moon controls in storefront/admin headers. An inline head script applies a validated saved preference before paint; first visits follow the device preference. Storage and system-preference changes update active tabs.
- Resend signup confirmation, useful email delivery/rate-limit/password-policy messages, no-store Auth responses, bounded request validation and clearer malformed-response handling.
- Cart storage validates/deduplicates product references. Product detail rejects conflicting game accounts and excess quantities. Checkout sends only current account fields and preserves retry keys even without session storage in the current mounted page.
- Customer/admin order search and status filters cover the 100 loaded orders. Buyer email is added only by the authorized admin handler. Delivery copying is explicitly labeled as simulated.
- Historical planning files now point to the current approved mock-payment scope.

## Observed in local browser

- The running shop loaded 29 products from the Go API.
- Both light and dark storefronts rendered at the normal desktop viewport. The sun/moon button changed the theme, and reload retained dark mode.
- Navigation to login retained the chosen theme. The light resend-confirmation form displayed an email field and submit action; no email or credential was entered or sent.
- Visiting `/admin` anonymously redirected to `/login?next=/admin`; the theme persisted there.
- Eight text/accent/status token pairs were calculated from rendered CSS values. Light ratios ranged from 5.83:1 to 15:1; dark ratios from 8.96:1 to 17.28:1. These calculations cover those pairs, not every possible page combination.
- Screenshots were saved as local artifacts outside the repository: `deekub-light.jpg` and `deekub-dark.jpg`.

## External setup and acceptance

The attempted Admin bootstrap found no matching Auth account and made no role change. The user then requested signup first and separate role assignment later. New accounts remain USER; no automatic ADMIN promotion was added.

Authenticated signup/confirmation/recovery, checkout/payment/cancellation, USER denial and ADMIN editing have not been observed with a confirmed account in this environment. Existing pending acceptance in `2026-10-06-shop-core.md` remains open. No test suites were added or run. No production/payment-provider readiness is claimed.

## Compilation and static checks

- `npm run typecheck`: exit 0.
- Final `npm run lint`: exit 0.
- Final `npm run build`: exit 0, Next.js production compilation and TypeScript completed, all 14 pages generated.
- `go build -buildvcs=false ./...`: exit 0.
- `go vet -buildvcs=false ./...`: exit 0.

The Go cache was scoped to `apps/api/.cache/go-build`. No new schema migration was needed for these changes. Compilation is separate from the pending authenticated runtime acceptance.

## Antislop delivery scope

Direction: light/dark extension of `docs/DESIGN.md`, ENERGY 2 / RHYTHM 2 / MOTION 1. Game art and price hierarchy stay the focal points; the only new header action has a 44px target and an accessible destination-theme label. No decorative asset or motion was added. Public theme/form states were observed; protected states and a complete keyboard/mobile pass remain pending and the full R-35/resilience gate is not marked passed.
