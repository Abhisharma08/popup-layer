# PopLayer Production Audit

Audit date: 2026-07-06

## Executive Verdict

PopLayer is live and receiving real leads, so it is a functioning MVP. It is not yet a production-grade enterprise SaaS. The current system can continue operating for the five active websites, but it should be treated as a live beta that needs immediate hardening before traffic, customers, or compliance expectations increase.

Final verdict: reject enterprise production approval; approve only as a controlled MVP with urgent conditions.

Overall score: 34/100

## Immediate Live Risk Summary

The most important point is practical: do not rewrite the embed flow first. It is already working. Stabilize the backend around the existing embed contract.

Critical risks:

- Public lead and analytics endpoints can be called by anyone who knows a popup ID.
- Webhook delivery accepts user-controlled URLs and can be abused for SSRF.
- Authenticated API CORS reflects arbitrary origins.
- JWTs live in localStorage and have no revocation or refresh-token strategy.
- Analytics queries will not scale beyond small traffic.
- The database lacks the indexes and data types needed for reliable reporting.
- No verified domain ownership exists for the five live websites.
- No operational backup, monitoring, abuse detection, or incident playbook is visible in the repo.

## 1. Project Structure

Score: 5/10

The repository is simple and understandable: `backend`, `frontend`, and `embed` are separated clearly. That is good for a small product. The issue is that each package is still organized as a prototype.

Findings:

- Backend routes contain validation, authorization checks, persistence, serialization, webhook dispatch, and response formatting in the same files.
- There is no domain/service layer for popups, leads, analytics, webhooks, users, workspaces, or billing.
- Frontend has a very large builder page with templates, form editing, trigger editing, persistence, toast behavior, and layout controls in one component.
- Shared concepts such as popup status, popup type, roles, trigger types, and field types are duplicated as strings across client and server.
- Documentation describes features that are not actually implemented, such as Redis-backed rate limiting and session management.
- `node_modules` exists under `embed` in the working tree and should not be committed if present in git.

Recommended structure:

- `backend/src/modules/auth`
- `backend/src/modules/workspaces`
- `backend/src/modules/popups`
- `backend/src/modules/leads`
- `backend/src/modules/analytics`
- `backend/src/modules/webhooks`
- `backend/src/modules/embed`
- `backend/src/shared/http`
- `backend/src/shared/security`
- `backend/src/shared/validation`

## 2. Architecture Review

Score: 4/10

The architecture is an MVP monolith. That is acceptable for early product validation, but several design choices will block enterprise readiness.

Strengths:

- Clear split between dashboard, API, and embeddable runtime.
- Embed script is small and dependency-light.
- Basic workspace authorization checks exist.
- Prisma provides a safer DB access layer than hand-written SQL.

Weaknesses:

- No explicit tenant boundary object beyond `Workspace`.
- No organization/team/account model.
- No permission model beyond owner/admin/member strings.
- No domain ownership verification.
- No job queue for webhooks or analytics ingestion.
- No event pipeline or aggregation table.
- No API versioning.
- No durable session model.
- No billing, plans, quotas, or feature flags.

Future scaling risk:

The first major failure point will be analytics. Every popup view creates a row in `AnalyticsEvent`, and the dashboard counts rows directly per popup. Once live sites generate meaningful traffic, dashboard loading will slow, database CPU will rise, and count queries will become expensive.

Better target architecture:

- Keep the monolith, but modularize it.
- Add a queue for webhook delivery and async analytics processing.
- Store raw events for short retention and maintain rollup tables for dashboard queries.
- Add a verified `WorkspaceDomain` table.
- Add `Organization`, `Membership`, `Role`, and `Permission` concepts.
- Add API keys and signed embed/event tokens.
- Add explicit plan limits and feature gates.

## 3. Frontend Review

Score: 5/10

The frontend is good enough for an internal MVP dashboard but not polished enough for a serious SaaS launch.

React and state:

- Zustand is reasonable for this scale.
- Builder state is global and can leak between edit/create flows if reset paths are missed.
- Auth state stores token/user in localStorage only.
- Route protection only checks whether a token exists, not whether it is valid.

Component architecture:

- `PopupBuilder.jsx` is too large and should be split into panels:
  - `BuilderSidebar`
  - `TemplatePicker`
  - `GeneralSettings`
  - `FieldEditor`
  - `StyleControls`
  - `TriggerControls`
  - `AbTestControls`
  - `BuilderPreview`
- `PopupPreview` is clean enough but should share schema/types with embed rendering behavior.

UX:

- Dashboard is minimal and lacks trend data, recent leads, top popup, conversion by site, and setup health.
- Popups page shows raw embed snippets, but does not show install status or last-seen event.
- Settings shows user IDs instead of user emails/names.
- No onboarding checklist.
- No first-run flow for installing on a website.
- No empty-state actions beyond simple text.
- No mobile dashboard navigation.
- Emoji icons should be replaced with a consistent icon set.

Accessibility:

- Several controls lack explicit accessible labels.
- Toasts are not announced to assistive tech.
- Modal/template areas are not keyboard-managed.
- No focus management after route changes or popup builder actions.
- Color contrast is user-configurable but not validated.

Performance:

- No route-level lazy loading.
- Recharts is loaded on the analytics route through normal route imports.
- Large builder page ships as part of the main app unless Vite chunks it opportunistically.
- No frontend error boundary.
- No request cancellation in effects.

## 4. Backend Review

Score: 4/10

The backend is compact and readable, but it mixes concerns and lacks production controls.

Authentication:

- JWT is signed with `JWT_SECRET` and expires in 7 days.
- No refresh tokens.
- No session table.
- No revocation.
- No device/session management.
- No password reset.
- No email verification.
- No MFA.
- No lockout after repeated failed login attempts.

Authorization:

- Basic workspace and popup access checks are present.
- Any accessible member can update/delete popups; role checks are not enforced for destructive actions.
- Member listing is available to any workspace member.
- No owner transfer, member removal, or role management controls.

Validation:

- Basic validators exist.
- Popup config/triggers are only checked as generic objects.
- Lead `customFields` has no key count, depth, or total size guard beyond global JSON body limit.
- Webhook URL syntax validation does not prevent private network targets.

Error handling:

- Central error handler exists.
- Error format is not standardized beyond `{ error }`.
- No request ID in responses.
- No structured logging.

Rate limiting:

- Uses in-memory `express-rate-limit` defaults unless configured otherwise.
- README claims Redis-backed rate limiting, but code does not use Redis for rate limiting.
- In-memory limits reset on process restart and do not work correctly across multiple API instances.

## 5. Database Review

Score: 3/10

The schema is enough for an MVP but weak for analytics-heavy SaaS.

Major issues:

- `Popup.config`, `Popup.triggers`, `configB`, `triggersB`, and `Lead.customData` are strings instead of JSON/JSONB.
- No indexes on `workspaceId`, `popupId`, `event`, `status`, or `createdAt`.
- Role/status/type fields are strings rather than enums.
- `WorkspaceMember.userId` has no relation to `User`.
- No soft delete.
- No audit log.
- No event rollups.
- No billing/subscription tables.
- No domain table.
- No invitation table.
- No API key table.
- No webhook delivery log.

Indexes to add immediately:

```prisma
@@index([userId])
@@index([workspaceId])
@@index([workspaceId, status])
@@index([popupId, createdAt])
@@index([popupId, event, createdAt])
```

Data model additions:

- `WorkspaceDomain`
- `Invitation`
- `AuditLog`
- `ApiKey`
- `WebhookDelivery`
- `Subscription`
- `Plan`
- `UsageCounter`
- `AnalyticsDailyRollup`
- `Session`
- `PasswordResetToken`

## 6. Security Audit

Score: 2/10

Critical: public event forgery

Scenario: attacker gets a popup ID from a website and posts thousands of fake VIEW or SUBMIT events. This inflates analytics, pollutes leads, consumes DB writes, and may trigger customer webhooks.

Fix:

- Bind popups to verified domains.
- Check `sourceUrl` origin against allowed domains.
- Add bot/honeypot fields.
- Add per-popup and per-domain rate limits.
- Add event signing or short-lived embed config tokens.

Critical: webhook SSRF

Scenario: a user sets webhook URL to `http://169.254.169.254/...`, `http://localhost:...`, or a private IP service on the VPS network. Lead submission causes the API server to make internal requests.

Fix:

- Parse and resolve webhook host.
- Block localhost, private IP ranges, link-local, multicast, and metadata IPs.
- Require HTTPS for production webhooks.
- Send webhooks from a queue worker with egress restrictions.
- Store delivery attempts and response metadata.

High: permissive CORS

Scenario: an attacker-controlled website can make credentialed browser requests to the API if a user has a token path that the browser exposes.

Fix:

- Dashboard/auth routes should allow only `FRONTEND_URL`.
- Public embed/leads/analytics endpoints can use explicit public CORS behavior.
- Do not combine reflected arbitrary origin with credentials.

High: localStorage JWT

Scenario: dashboard XSS or a malicious browser extension steals the token. The token remains valid for up to 7 days and cannot be revoked.

Fix:

- Use short-lived access token plus refresh token in HttpOnly secure same-site cookie.
- Store sessions in DB.
- Rotate refresh tokens.
- Add logout-all and token revocation.

Medium: CSV injection

Scenario: a lead submits a field beginning with `=`, `+`, `-`, or `@`; when exported and opened in spreadsheet software, it can execute formulas.

Fix:

- Prefix dangerous CSV cells with `'`.

Medium: password policy

Issue:

- Only minimum length is enforced.
- No breached-password check.
- No email verification.
- No reset flow.

Medium: headers

Issue:

- No Helmet security headers.
- Nginx config does not set HSTS, CSP, X-Content-Type-Options, Referrer-Policy, or frame protections.

## 7. API Review

Score: 4/10

The API is understandable but not mature.

Issues:

- No `/api/v1` versioning.
- Inconsistent public/private endpoint security model.
- No OpenAPI spec.
- No idempotency keys for lead submission or webhook delivery.
- Pagination uses offset only; acceptable for small lead lists but poor at scale.
- Export endpoint has no pagination/streaming and can load all leads into memory.
- Analytics endpoint returns strings for conversion rate.
- Error format is too minimal.
- No request IDs.
- No filtering/sorting contracts for leads.

Recommended standard error:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Valid email is required",
    "requestId": "req_..."
  }
}
```

## 8. Performance Review

Score: 4/10

Frontend:

- Admin bundle should use lazy routes.
- Builder should be split to reduce render surface.
- Recharts route should be code-split.
- Add optimistic loading/error/empty states with retry actions.

Backend:

- Analytics N+1 count queries are the largest known performance defect.
- Webhooks are initiated from the request path, even if not awaited.
- CSV export loads all leads at once.
- In-memory rate limits do not scale horizontally.

Database:

- Missing indexes will hurt as rows grow.
- Raw event table needs retention and rollups.
- JSON strings prevent efficient querying.

Embed:

- Bundle size is good: around 10 kB built, around 3.7 kB gzip in local build.
- Shadow DOM is good.
- Trigger listeners are not globally cleaned up if popup never fires.
- URL regex trigger can be expensive if customers enter pathological regex.

## 9. UX/UI Review

Score: 5/10

Current UX is MVP-level. It is not yet an enterprise SaaS experience.

Dashboard should show:

- Install status per site.
- Last event received.
- Leads today/7 days/30 days.
- Conversion trend.
- Top popup.
- Setup checklist.
- Recent leads.
- Delivery/webhook failures.

Builder should improve:

- Use a multi-panel information architecture.
- Add undo/redo.
- Add preview device switcher.
- Add desktop/mobile preview.
- Add accessibility warnings.
- Add color contrast checks.
- Add autosave or draft recovery.
- Add duplicate popup/template save.
- Add version history.

Analytics should improve:

- Date ranges.
- Funnel metrics.
- Variant comparison.
- Conversion by URL/domain/device.
- Export.
- Bot/spam filtering.
- Confidence indication for A/B tests.

Settings should improve:

- Show member email/name, not user ID.
- Add invite workflow.
- Add role management.
- Add domain verification.
- Add API keys.
- Add webhook logs.
- Add billing.

## 10. Product Review

Score: 3/10

PopLayer has the skeleton of a popup SaaS but lacks the operational and commercial features customers expect.

Missing critical product features:

- Billing and subscriptions.
- Plans and quotas.
- Trial lifecycle.
- Email verification.
- Password reset.
- Workspace onboarding.
- Domain verification.
- Team invitations.
- Role management.
- Audit logs.
- Webhook delivery logs.
- Native integrations.
- Consent/GDPR controls.
- Export management.
- Notification settings.
- Template marketplace/library.
- Version history.
- Campaign scheduling.
- Targeting by page/device/referrer/UTM/geo.
- Form consent checkboxes.
- Double opt-in support.
- Custom branding/white label.

## 11. SaaS Readiness

Score: 2/10

Not ready as SaaS beyond manually managed MVP usage.

Missing:

- Subscription system.
- Billing provider integration.
- Plans.
- Quotas.
- Usage metering.
- Feature flags.
- Organizations.
- Team invitations.
- Roles and permissions.
- Audit logs.
- Custom domains.
- White labeling.
- API keys.
- Marketplace/integration model.
- Admin console.
- Customer support tooling.

## 12. Developer Experience

Score: 4/10

Positive:

- Simple repo.
- Docker Compose exists.
- CI exists.
- Backend has a few unit tests.
- Embed builds quickly.

Problems:

- Local backend and frontend checks failed in this workspace because dependencies were missing.
- No root workspace/package manager orchestration.
- No formatter.
- No TypeScript.
- No OpenAPI contract.
- No seed script.
- No realistic integration tests.
- README claims Redis-backed features not implemented.
- No migration safety guide for live deployments.
- No backup/restore documentation.

## 13. Testing

Score: 2/10

Existing tests cover validators and basic authorization helper behavior. That is not enough for a live lead capture system.

Required tests:

- Auth signup/login integration tests.
- Workspace isolation tests.
- Popup CRUD authorization tests.
- Public embed endpoint tests.
- Public lead submission tests.
- Analytics event ingestion tests.
- Webhook SSRF blocking tests.
- CSV export injection tests.
- Rate-limit behavior tests.
- Frontend E2E happy path.
- Embed script browser tests.
- Migration tests.

## 14. DevOps

Score: 3/10

Docker Compose is enough for a VPS MVP, but not robust production.

Issues:

- API port is exposed directly.
- No reverse proxy TLS config in repo.
- No healthcheck for API/web services in compose.
- No backup job.
- No monitoring.
- No centralized logging.
- No alerting.
- No deployment rollback strategy.
- No zero-downtime migration strategy.
- Nginx config only serves static files; no security headers.
- Containers do not explicitly run as non-root.
- Redis is listed as dependency but no Redis service exists in compose.

Immediate VPS recommendations:

- Put API behind Nginx/Caddy with TLS.
- Close direct API port if reverse proxy handles traffic.
- Add daily Postgres backups.
- Add uptime monitoring for `/health`.
- Add disk space monitoring.
- Add log rotation.
- Add fail2ban or provider firewall rules.
- Add environment-variable inventory.

## 15. Production Readiness

Would I approve for enterprise production? No.

Would I allow the current five-site live MVP to continue while hardening? Yes, with immediate safeguards.

Conditions:

- Backup database now.
- Add domain allowlisting.
- Add SSRF blocking.
- Fix authenticated CORS.
- Add critical indexes.
- Add basic monitoring.
- Add abuse limits for public endpoints.
- Do not add new public customers until those are complete.

## 16. Missing Enterprise Features

Critical:

- SSO/SAML/OIDC.
- SCIM.
- RBAC.
- Audit logs.
- Organizations.
- Team invitations.
- Domain verification.
- API keys.
- Billing.
- Usage limits.
- Backups.
- Data retention controls.
- GDPR deletion/export.
- DPA/security docs.
- Webhook logs and retries.
- Admin console.

Important:

- Custom domains.
- White labeling.
- Version history.
- Approval workflow.
- Comments/collaboration.
- Feature flags.
- Environments.
- SLA monitoring.
- Incident management.
- Data residency.
- Consent management.

Optional:

- Template marketplace.
- AI copy suggestions.
- Advanced experimentation.
- Revenue attribution.
- Heatmaps/session replay integrations.

## 17. Competitive Gap

Critical gaps versus mature popup platforms:

- Advanced targeting.
- Domain/site management.
- A/B test reporting with statistical confidence.
- Native integrations.
- Campaign scheduling.
- Templates at scale.
- Billing and plan limits.
- Team/role management.
- Consent/GDPR features.
- Installation diagnostics.

Important gaps:

- Multi-step popups.
- Sticky bars.
- Fullscreen overlays.
- Inline forms.
- Spin wheels/gamified offers.
- Geo/referrer/UTM targeting.
- Shopify/WooCommerce/cart targeting.
- Autoresponder emails.
- CRM sync history.
- Webhook retry logs.

Optional gaps:

- AI-assisted copy.
- Marketplace.
- Agency/client management.
- Revenue attribution.
- Personalization rules.

## 18. Code Quality

Score: 5/10

The code is readable, but too much behavior lives in route/page files.

Debt:

- Large frontend builder component.
- Magic strings for statuses/types/roles.
- Duplicated serialization logic for popups.
- Stringified JSON parsing in multiple places.
- Weak comments/documentation around live embed compatibility.
- Minimal logging.
- No typed contracts.
- No domain-level errors.

## 19. Bug Hunt

Confirmed or likely bugs:

- `once_per_user` frequency is exposed in UI but not implemented in embed.
- Signup can leave partial user/workspace/member records if one create fails.
- Members endpoint returns user IDs only, not useful user data.
- Any accessible member appears able to update/delete popups.
- Analytics conversion rate is returned as a string.
- Export can create spreadsheet formula injection.
- Export can load too much data into memory.
- Webhook failures are only logged to console and not visible to users.
- Custom fields can create oversized or hostile payloads within body limit.
- URL regex triggers can fail silently or perform poorly.
- Route protection accepts any token-looking value until API call fails.
- Login "remember me" UI has no functional effect.

## 20. Refactoring Plan

### Immediate: 1 day

- Take a database backup.
- Lock authenticated CORS to dashboard domain.
- Add webhook SSRF blocking.
- Add basic domain allowlisting for live websites.
- Add Prisma indexes and deploy migration.
- Fix `once_per_user` UI or remove it until implemented.
- Add CSV injection escaping.
- Add Helmet and compression.
- Add request ID logging.
- Add health monitoring on VPS.

### Short term: 1 week

- Add `WorkspaceDomain`.
- Add webhook queue and delivery log.
- Add service layer for leads, analytics, popups, webhooks.
- Add integration tests for public lead/event flows.
- Add role checks for destructive actions.
- Add password reset and email verification.
- Add user email/name to members listing.
- Add frontend error states and install diagnostics.

### Medium term: 1 month

- Migrate stringified JSON to JSONB.
- Add analytics rollups.
- Add billing/plans/usage limits.
- Add invitations and role management.
- Add audit logs.
- Add API keys.
- Add advanced targeting rules.
- Add E2E tests.
- Add backup/restore documentation.
- Add observability dashboard.

### Long term: 3 months

- Add SSO/SAML/OIDC.
- Add SCIM.
- Add custom domains and white labeling.
- Add compliance workflows.
- Add agency/client management.
- Add integration marketplace.
- Add multi-region or managed infrastructure plan.
- Add incident response and SLA processes.

## 21. Final Scorecard

| Category | Score |
|---|---:|
| Architecture | 4/10 |
| Security | 2/10 |
| Performance | 4/10 |
| Scalability | 3/10 |
| Maintainability | 5/10 |
| Developer Experience | 4/10 |
| UI/UX | 5/10 |
| Accessibility | 3/10 |
| Testing | 2/10 |
| Code Quality | 5/10 |
| SaaS Readiness | 2/10 |
| Enterprise Readiness | 1/10 |

Overall: 34/100

## 22. Final Decision

Deployment decision: reject full production deployment.

Operational decision for current live state: continue live MVP only with urgent hardening.

The product has enough working code to validate demand and collect leads. It does not yet have the security, data model, operational controls, or product completeness required for a serious SaaS launch. The safest path is not a rewrite. The safest path is to harden the live backend first, preserve the current embed contract, and then refactor toward a proper SaaS architecture in stages.
