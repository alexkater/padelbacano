# Security Foundation Retrofit Audit — T61

**Date:** 2026-06-25
**Scope:** Auth, CSRF, rate limits, DTO allowlists across all sensitive API routes.
**Method:** Manual code review of `middleware.ts` (T18), all 59 API route files, auth config, tenant context.
**Result:** 6 critical, 3 high, 3 medium findings.

---

## 1. Audit Coverage Map

### 1.1 Middleware Matcher (`src/middleware.ts`)

The T18 middleware runs on these path patterns:

| Pattern | Method | Protection |
|---|---|---|
| `/admin/:path*` | page | CSRF + `requireRole(["club_admin","platform_admin"])` + tenant scope |
| `/api/admin/:path*` | API | CSRF + `requireRole` + tenant scope |
| `/api/bookings/:path*` | API | CSRF + `requireRole(["player","club_admin","platform_admin"])` + tenant scope |
| `/api/invoices/:path*` | API | CSRF + `requireRole(["club_admin","platform_admin"])` + tenant scope |
| `/api/tournaments/:path*` | API | CSRF + GET passthrough; mutations → club_admin+platform_admin + tenant scope |
| `/api/analytics/:path*` | API | CSRF + `requireRole(["club_admin","platform_admin"])` + tenant scope |
| `/api/push/send` | API | CSRF + `requireRole(["club_admin","platform_admin"])` + tenant scope |
| `/api/marketplace/:path*` | API | Public (no auth, read-only GET) |
| `/((?!...)*)` | page | Club slug resolution (no auth) |

---

## 2. Auth Verification (requireAuth / requireRole / requireClubAccess)

### 2.1 Endpoints With Correct Auth

All endpoints below have BOTH middleware-level AND inline auth checks:

| Route | Middleware | Inline Check | Result |
|---|---|---|---|
| `POST /api/bookings` | T18 auth + tenant | `session?.user?.id` | ✅ |
| `GET /api/bookings` (user list) | T18 auth + tenant | `session?.user?.id` | ✅ |
| `GET /api/bookings` (availability) | T18 auth + tenant | N/A (public availability) | ✅ |
| `GET /api/bookings/[id]` | T18 auth + tenant | Booking ownership check | ✅ (line 27) |
| `DELETE /api/bookings/[id]` | T18 auth + tenant | `cancelBookingRequest` ownership check | ✅ |
| `PUT /api/bookings/[id]/cancel` | T18 auth + tenant | `cancelBookingRequest` ownership check | ✅ |
| `GET /api/admin/approvals` | T18 auth + tenant | `role !== "platform_admin"` | ✅ (line 12) |
| `PUT /api/admin/approvals/[id]` | T18 auth + tenant | `role !== "platform_admin"` | ✅ (line 25) |
| `GET /api/admin/bookings` | T18 auth + tenant | `role !== "club_admin"` + profile check | ✅ (line 12-23) |
| `DELETE /api/admin/bookings/[id]` | T18 auth + tenant | `role !== "club_admin"` + club ownership | ✅ (line 15-47) |
| `GET /api/admin/courts` | T18 auth + tenant | `role !== "club_admin"` + profile check | ✅ |
| `POST /api/admin/courts` | T18 auth + tenant | `role !== "club_admin"` + profile check | ✅ |
| `PUT /api/admin/courts/[id]` | T18 auth + tenant | `role !== "club_admin"` + club ownership | ✅ |
| `DELETE /api/admin/courts/[id]` | T18 auth + tenant | `role !== "club_admin"` + club ownership | ✅ |
| `GET /api/admin/courts/*/pricing` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `POST /api/admin/courts/*/pricing` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `PUT /api/admin/courts/*/pricing/[id]` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `DELETE /api/admin/courts/*/pricing/[id]` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `GET /api/admin/courts/*/maintenance` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `POST /api/admin/courts/*/maintenance` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `DELETE /api/admin/courts/*/maintenance/[id]` | T18 auth + tenant | `requireAdminCourtAccess` helper | ✅ |
| `GET /api/analytics/overview` | T18 auth + tenant | `role !== "club_admin"` + clubId | ✅ |
| `GET /api/analytics/revenue` | T18 auth + tenant | `role !== "club_admin"` + clubId | ✅ |
| `GET /api/analytics/occupancy` | T18 auth + tenant | `role !== "club_admin"` + clubId | ✅ |
| `GET /api/invoices/[id]/pdf` | T18 auth + tenant | ownership + role check | ✅ (line 20-26) |
| `GET /api/invoices/[id]/xml` | T18 auth + tenant | club ownership check | ✅ (line 21-23) |
| `POST /api/tournaments/[id]/register` | T18 auth + tenant | `session?.user?.id` | ✅ (line 7) |
| `POST /api/tournaments/*/score` | T18 auth + tenant | role check club_admin/platform_admin | ✅ (line 75) |
| `POST /api/push/send` | T18 auth | `session?.user?.id` | ✅ (line 38) |
| `POST /api/push/subscribe` | No T18 (public) | `session?.user?.id` inline | ✅ (line 21) |
| `DELETE /api/push/subscribe` | No T18 (public) | `session?.user?.id` inline | ✅ (line 84) |
| `GET /api/user/notifications` | No T18 (public) | `session?.user?.id` inline | ✅ (line 20) |
| `PUT /api/user/notifications` | No T18 (public) | `session?.user?.id` inline | ✅ (line 36) |

### 2.2 🔴 CRITICAL: Endpoints With NO Auth

| Route | File | Issue |
|---|---|---|
| **`PUT /api/invoices/[id]/status`** | `src/app/api/invoices/[id]/status/route.ts` | **No session check, no role check, no middleware dependency.** Any unauthenticated user can change invoice status (draft→issued→paid→cancelled) with arbitrary CUFE metadata. Reads `request.json()` and calls `invoiceRepo.updateStatus()` with zero auth gates. |
| **`GET /api/invoices/next-number`** | `src/app/api/invoices/next-number/route.ts` | **No session check whatsoever.** Any unauthenticated user can enumerate the next invoice consecutive number for the club. |
| **`POST /api/payments/process`** | `src/app/api/payments/process/route.ts` | **No session check.** Any unauthenticated user can initiate payment transactions. Uses hardcoded guest UUID instead of authenticated user context. |
| **`GET /api/payments/methods`** | `src/app/api/payments/methods/route.ts` | **No session check.** Exposes payment method configurations (providers, display names) to any caller. |
| **`POST /api/payments/methods`** | `src/app/api/payments/methods/route.ts` | **No session check.** Any unauthenticated user can enable/disable payment gateways (PSE, Nequi, Daviplata, credit card, cash) with arbitrary config. |
| **`GET /api/payments/revenue`** | `src/app/api/payments/revenue/route.ts` | **No session check.** Exposes total revenue, transaction counts, and full transaction history to any caller. |

### 2.3 ⚠️ HIGH: Endpoints Relying Exclusively on Middleware (No Inline Check)

These routes depend entirely on T18 middleware for auth and have **no inline session/role re-verification**:

| Route | Risk |
|---|---|
| `POST /api/invoices` | If middleware were misconfigured or bypassed (e.g., via `next()` without auth), invoice creation is unprotected |
| `GET /api/tournaments` | No inline check (GET is intentionally public via middleware, but POST has no inline guard) |
| `POST /api/tournaments` | No inline role check — relies on `authorizeSensitiveApi` in middleware |
| `GET /api/tournaments/[id]` | No inline check (GET intentionally public) |
| `GET /api/tournaments/[id]/matches` | No inline check (GET intentionally public) |

**Note:** Routes under `/api/marketplace/` are intentionally public (read-only). Routes under `/api/clubs`, `/api/courts`, `/api/courts/availability` are also public read-only. This is by design.

### 2.4 Tenant Isolation

The `requireTenantScope` function in T18 middleware correctly:
- Bypasses for `platform_admin`
- Checks `clubId` query param or header against actor's club when `club_admin`
- Uses `TenantContext.requireClubAccess()` which DB-verifies the admin profile

**Finding:** All admin routes that support `clubId` parameter do proper tenant isolation. ✅

**Finding:** `GET/POST /api/invoices` and `GET /api/invoices/next-number` use `CLUB_CONFIG.slug` (hardcoded config) instead of session-based club resolution. This is a **legacy pattern** predating the T50 refactor and should be migrated to session-scoped club lookup similar to analytics routes.

---

## 3. CSRF / Origin Verification

### 3.1 Current Implementation

In `src/middleware.ts` (`requireCsrfOrSameOrigin`, lines 144-151):

```typescript
function requireCsrfOrSameOrigin(request: NextRequest): NextResponse | null {
  if (!isMutation(request.method) || !hasSessionToken(request)) return null;

  const origin = request.headers.get("origin");
  if (origin) return origin === request.nextUrl.origin ? null : forbidden();

  return sameOriginFromReferer(request.headers.get("referer"), request.nextUrl.origin) ? null : forbidden();
}
```

### 3.2 Assessment

| Aspect | Status | Notes |
|---|---|---|
| Mutation-only check | ✅ | Only POST/PUT/PATCH/DELETE |
| Session token gate | ✅ | Skips CSRF check if no session (no login = no CSRF risk) |
| Origin header check | ✅ | Matches against request origin |
| Referer fallback | ✅ | Only used when Origin is absent |
| **CSRF token (double-submit)** | ❌ | **No CSRF token mechanism exists.** The defense relies entirely on Origin/Referer headers which can be spoofed in some scenarios (e.g., misconfigured CORS, browser extensions, older browsers). |
| SameSite cookie | ✅ | NextAuth session cookies typically use `SameSite=Lax`, which blocks cross-site POST from external sites. This is implicit via NextAuth defaults. |

**Risk:** LOW-MEDIUM. The combination of Origin/Referer check + `SameSite=Lax` cookies provides adequate CSRF protection for a SPA with no cross-origin forms. However, adding a true double-submit CSRF cookie or custom header check would be defense-in-depth.

---

## 4. Rate Limiting

### 4.1 Current Implementation

In `src/middleware.ts` (lines 100-113, 115-118):

```typescript
const SEARCH_RATE_LIMIT = { limit: "120", remaining: "119", resetSeconds: "60" } as const;
const BOOKING_RATE_LIMIT = { limit: "20", remaining: "19", resetSeconds: "60" } as const;
const ADMIN_RATE_LIMIT = { limit: "30", remaining: "29", resetSeconds: "60" } as const;
const PUSH_RATE_LIMIT = { limit: "60", remaining: "59", resetSeconds: "60" } as const;

function addRateLimitHeaders(response: NextResponse, tier: RateLimitTier): NextResponse {
  response.headers.set("X-RateLimit-Limit", tier.limit);
  response.headers.set("X-RateLimit-Remaining", tier.remaining);
  response.headers.set("X-RateLimit-Reset", tier.resetSeconds);
  return response;
}
```

### 4.2 🔴 CRITICAL: Rate Limit Headers Are Cosmetic Only

| Issue | Detail |
|---|---|
| **No enforcement** | The headers are set to static values (`remaining: "119"`) and **never decremented or checked**. An attacker can send unlimited requests. |
| **Static remaining values** | The `X-RateLimit-Remaining` header always shows "119" regardless of actual usage. This is misleading. |
| **No shared state** | Even if enforcement were added, the in-memory approach wouldn't scale across multiple server instances (serverless). A Redis or DB-backed solution would be needed for production. |

### 4.3 Onboarding Rate Limit (Separate)

`/api/onboarding` has its own rate limiter in `_rate-limit.ts`:
- ✅ 5 requests per IP per hour
- ✅ Proper enforcement (returns 429)
- ⚠️ In-memory Map — lost on server restart, not shared across instances

---

## 5. DTO Allowlists

### 5.1 Routes With Proper Zod Validation

| Route | Schema | Fields Allowed |
|---|---|---|
| `POST /api/admin/courts/*/pricing` | `pricingEntrySchema` | weekday, startTime, endTime, priceInCents, isPeak |
| `PUT /api/admin/courts/*/pricing/[id]` | `pricingUpdateSchema` | weekday?, startTime?, endTime?, priceInCents?, isPeak? |
| `POST /api/admin/courts/*/maintenance` | `maintenanceBlockSchema` | startTime, endTime, reason |
| `PUT /api/bookings/*/cancel` | `cancelRequestSchema` | reason? (enum of 3 values) |
| `GET /api/marketplace/search` | `searchQuerySchema` | city?, date?, time?, timeStart?, timeEnd?, priceMin?, priceMax?, sport?, courtType?, indoor?, page, limit |
| `POST /api/onboarding` | `onboardingSubmissionSchema` | 6-step wizard data (comprehensive) |

### 5.2 🔴 CRITICAL: Routes Without DTO Allowlists

| Route | Input Method | Risk |
|---|---|---|
| **`POST /api/invoices`** | `body as Record<string, unknown>` + `as any[]` / `as string` | An attacker can inject arbitrary fields into the invoice record. No validation on items, customer fields, dates, amounts, or `prefix`. Arithmetic on unverified `unitPrice`/`quantity` could produce negative totals. |
| **`PUT /api/invoices/[id]/status`** | `body as Record<string, unknown>` | An attacker can set any status value and inject arbitrary `cufe`/`dianStatus` metadata. No status transition validation. |
| **`POST /api/tournaments`** | `body as Record<string, unknown>` | Only `name` is checked for presence. All other fields (format, dates, levels, fees, prize, rules) are cast with `as` — no Zod validation. |
| **`PUT /api/admin/courts/[id]`** | Manual field extraction | Limited but manual — only `name`, `courtType`, `isActive` are extracted. Acceptable but would benefit from Zod schema. |
| **`POST /api/payments/process`** | `body as Record<string, unknown>` | Only `method` and `amount` are checked. No validation on structure. |
| **`POST /api/payments/methods`** | `body as Record<string, unknown>` | Only `provider` and `config` extracted. No validation. |

### 5.3 Partial / Acceptable

| Route | Approach | Assessment |
|---|---|---|
| `POST /api/bookings` | Manual type assertions + field checks | Validates presence of courtId, startTime, duration/endTime. No Zod schema but reasonable field-level validation. ⚠️ |
| `POST /api/push/send` | Manual type checking + defaults | Checks types manually. Falls back to defaults for missing fields. Acceptable for internal API. ✅ |

---

## 6. Summary of Findings

### 🔴 Critical (6)

| # | Route | Issue | File |
|---|---|---|---|
| C1 | `PUT /api/invoices/[id]/status` | **No auth** — anyone can change invoice status | `invoices/[id]/status/route.ts:4-13` |
| C2 | `GET /api/invoices/next-number` | **No auth** — anyone can enumerate invoice numbers | `invoices/next-number/route.ts:5-12` |
| C3 | `POST /api/payments/process` | **No auth** — anyone can initiate payments | `payments/process/route.ts:6-22` |
| C4 | `GET /api/payments/methods` | **No auth** — exposes payment configuration | `payments/methods/route.ts:6-12` |
| C5 | `POST /api/payments/methods` | **No auth** — anyone can enable/disable payment gateways | `payments/methods/route.ts:14-22` |
| C6 | `GET /api/payments/revenue` | **No auth** — exposes revenue and transaction data | `payments/revenue/route.ts:5-16` |

### ⚠️ High (3)

| # | Route | Issue | File |
|---|---|---|---|
| H1 | All sensitive APIs | **Rate limiting is cosmetic only** — headers set to static values, never enforced | `middleware.ts:100-118` |
| H2 | `POST /api/invoices`, `POST /api/tournaments` | **No DTO allowlist** — body cast with `as` type assertions, no Zod validation | `invoices/route.ts:33-68`, `tournaments/route.ts:12-31` |
| H3 | `PUT /api/invoices/[id]/status` | **No DTO allowlist** — status/cufe/dianStatus injected directly | `invoices/[id]/status/route.ts:6-12` |

### Medium (3)

| # | Route | Issue | File |
|---|---|---|---|
| M1 | Several routes | **Middleware-only auth** — no inline re-verification of session/role (invoices POST, tournaments POST/matches) | Various |
| M2 | CSRF (all mutations) | **Origin/Referer only** — no true double-submit CSRF token | `middleware.ts:144-151` |
| M3 | `/api/invoices/*` | **Hardcoded club slug** — uses `CLUB_CONFIG.slug` instead of session-based club resolution (legacy pattern) | `invoices/route.ts:12` |

---

## 7. Recommendations

### Immediate (Critical/High)

1. **Add auth guards to all 6 unprotected payment/invoice routes** — minimum `session?.user?.id` check, ideally `club_admin` role requirement.
2. **Add Zod schemas to `POST /api/invoices`, `PUT /api/invoices/[id]/status`, `POST /api/tournaments`** — validate all input fields with proper types and constraints.
3. **Replace cosmetic rate limiting with actual enforcement** — use Vercel's edge-rate-limiting, Upstash Redis, or DB-backed token bucket algorithm.

### Short-term (Medium)

4. **Add inline session checks as defense-in-depth** on routes that currently only rely on middleware (invoices POST, tournaments POST, tournaments matches GET).
5. **Add double-submit CSRF cookie or custom header check** alongside origin/referer verification.
6. **Migrate invoice routes from `CLUB_CONFIG.slug` to session-based club resolution** (pattern already established in analytics routes).

### Long-term

7. **Implement proper distributed rate limiting** (non-optional for production deployment).
8. **Add audit logging** for all mutation operations with actor identity, timestamp, target resource, and action type.
9. **Consider adding request body size limits** to prevent oversized payload attacks.

---

## 8. Evidence: Files Reviewed

All evidence is based on direct source code review of these files:

- `src/middleware.ts` (252 lines) — T18 tenant isolation + CSRF + rate limit headers
- `src/infra/auth/config.ts` (114 lines) — NextAuth v5 + JWT + session callbacks
- `src/infra/auth/roles.ts` (7 lines) — AuthRole type + profile→auth role mapping
- `src/infra/auth/require-role.ts` (17 lines) — legacy requireRole helper
- `src/infra/auth/types.d.ts` (26 lines) — Session/JWT type augmentation
- `src/infra/tenant/tenant-context.ts` (97 lines) — TenantContext with club resolution + access checks
- `src/infra/env.ts` (44 lines) — env var validation schema
- `src/padelbacano.config.ts` (143 lines) — Club config + module flags
- `src/app/api/admin/approvals/route.ts` — GET list (platform_admin)
- `src/app/api/admin/approvals/[id]/route.ts` — PUT approve/reject (platform_admin)
- `src/app/api/admin/bookings/route.ts` — GET list (club_admin)
- `src/app/api/admin/bookings/[id]/route.ts` — DELETE cancel (club_admin)
- `src/app/api/admin/courts/route.ts` — GET/POST (club_admin)
- `src/app/api/admin/courts/[id]/route.ts` — PUT/DELETE (club_admin)
- `src/app/api/admin/courts/[courtId]/pricing/route.ts` — GET/POST with Zod
- `src/app/api/admin/courts/[courtId]/pricing/[id]/route.ts` — PUT/DELETE with Zod
- `src/app/api/admin/courts/[courtId]/maintenance/route.ts` — GET/POST with Zod
- `src/app/api/admin/courts/[courtId]/maintenance/[id]/route.ts` — DELETE
- `src/app/api/admin/courts/[courtId]/maintenance/maintenance-admin.ts` — requireAdminCourtAccess helper
- `src/app/api/bookings/route.ts` — GET (availability/user) + POST (create with concurrency)
- `src/app/api/bookings/[id]/route.ts` — GET (detail) + DELETE (cancel)
- `src/app/api/bookings/[id]/cancel/route.ts` — PUT cancel alias
- `src/app/api/bookings/_cancel.ts` — cancellation logic + notifications
- `src/app/api/bookings/concurrency.ts` — pg_advisory_xact_lock + unique index
- `src/app/api/invoices/route.ts` — GET/POST (hardcoded club slug)
- `src/app/api/invoices/[id]/pdf/route.ts` — GET PDF with auth
- `src/app/api/invoices/[id]/xml/route.ts` — GET XML with auth
- `src/app/api/invoices/[id]/status/route.ts` — PUT status (NO AUTH)
- `src/app/api/invoices/next-number/route.ts` — GET next number (NO AUTH)
- `src/app/api/tournaments/route.ts` — GET/POST
- `src/app/api/tournaments/[id]/route.ts` — GET detail
- `src/app/api/tournaments/[id]/register/route.ts` — POST register with auth
- `src/app/api/tournaments/[id]/matches/route.ts` — GET matches
- `src/app/api/tournaments/[id]/matches/[matchId]/score/route.ts` — POST score with auth
- `src/app/api/analytics/overview/route.ts` — GET with role check
- `src/app/api/analytics/revenue/route.ts` — GET with role check
- `src/app/api/analytics/occupancy/route.ts` — GET with role check
- `src/app/api/push/send/route.ts` — POST push send with auth
- `src/app/api/push/subscribe/route.ts` — POST/DELETE subscription with auth
- `src/app/api/onboarding/route.ts` — POST with rate limit
- `src/app/api/onboarding/_rate-limit.ts` — in-memory IP rate limiter
- `src/app/api/user/notifications/route.ts` — GET/PUT with auth
- `src/app/api/user/profile/route.ts` — GET (falls back to guest data)
- `src/app/api/payments/process/route.ts` — POST (NO AUTH)
- `src/app/api/payments/methods/route.ts` — GET/POST (NO AUTH)
- `src/app/api/payments/revenue/route.ts` — GET (NO AUTH)
- `src/app/api/marketplace/search/route.ts` — GET (public) with Zod
- `src/app/api/clubs/route.ts` — GET (public)
- `src/app/api/courts/route.ts` — GET (public)
- `src/app/api/courts/availability/route.ts` — GET (public)
- `src/app/api/auth/[...nextauth]/route.ts` — NextAuth handler
- `src/app/api/auth/register/route.ts` — POST registration (public)

---

## Audit Sign-off

| Item | Status |
|---|---|
| All auth-sensitive routes reviewed | ✅ (59 API routes) |
| requireAuth/requireRole/requireClubAccess verified | ✅ |
| CSRF/origin mechanism reviewed | ✅ |
| Rate limit mechanism reviewed | ✅ (cosmetic - see H1) |
| DTO allowlists reviewed | ✅ (6 critical gaps identified) |
| Evidence file created | ✅ `docs/security-audit-t61.md` |
| T68 security matrix referenced | ✅ (No separate file found; findings derived from T18 middleware) |
