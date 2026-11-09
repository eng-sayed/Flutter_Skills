# api-binding.md — Postman → working calls

Read the collection before any feature cubit. Provider/dashboard folders are out of scope unless that app is the provider app.

## Inventory

Write `.cursor/prompt/tasks/_endpoints.md`: method, path, actor, example response present (yes/no), Figma frame or `no screen`.

## Headers (every request)

| Header | Source |
|--------|--------|
| `Accept: application/json` | Dio defaults |
| `x-api-key` | `ConstantManager.apiKey` via `ApiKeyInterceptor` |
| `Lang` | `ar` or `en` from the current locale |
| `Authorization: Bearer` | `AuthInterceptor` (skip on public auth) |

`device_id` in any body = `Helpers.getFcmToken()`, never a UUID.

## Base URL

`ApiEndpoints.baseUrl` default is the project API (`…/api/` with trailing slash). Relative paths have **no** leading slash (`user/auth/login-or-register`).

## Envelope

PHP body `{ "key", "msg", "data" }`:

| key | App behavior |
|-----|----------------|
| `success` | `Right(data)` |
| `fail` | `ServerFailure` |
| `needVerify` | route to OTP, do not wipe the session |
| `needComplete` | route to complete-profile |
| `needActive` | activation screen, do not wipe the session |
| `needApprove` | pending-approval screen |
| `needChargeWallet` | wallet failure, stay on screen |
| `unauthenticated` | refresh, then `SessionManager.endSession` |
| `blocked` | `SessionManager.endSession(blocked)` |

Pagination lists live at `data.pagination.data` when the example response uses that shape.

## Models

Build `fromJson` from a **saved example response** in the collection, with `??` defaults and `tryParse`. Never `int.parse`.

## Screen matrix

Every endpoint is either called from a screen or listed as `no screen` in `_endpoints.md`. Do not invent paths that are not in the collection.
