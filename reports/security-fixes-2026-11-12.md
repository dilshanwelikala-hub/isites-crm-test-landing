# Critical security fixes

Date: 12 November 2026
Scope: draft exposure, unsafe inquiry updates, preview secrets, and dependency upgrades requested after the 6 November audit.

## Changes implemented

### Public content and draft access

- Anonymous Sites reads require both published status and a live site.
- Anonymous package reads require a published package and a published/live parent site, or the explicit default-site scope.
- The homepage global is restricted to its published content. Version-history access requires authentication.
- The public frontend enforces collection/global access policies rather than relying solely on frontend filters. Signed previews are the explicit exception.
- Static demo-package fallbacks were removed from homepage/detail/sitemap/analytics lookups, so absent or unpublished offers are not silently restored.
- Existing authenticated editor access to drafts is preserved. Fine-grained roles and client memberships remain separate work.

Main files: `src/lib/contentAccess.ts`, Sites, LandingPackages, LandingPage, public page routes, and sitemap.

### Inquiry safety and customer integrity

- Contact lookup matches normalized email and the exact site, including an explicit no-site scope for the default website.
- New inquiries preserve an existing contact's name, phone, company, owner, preferred channel, source, notes, and lifecycle. Only the last-inquiry timestamp is updated.
- Public submission fields are allowlisted before contact processing. Forged owner, priority, value, internal notes, contact relationship, and workflow fields are discarded.
- Site/package eligibility, required contact consent, basic field lengths, guest counts, and source URL format are validated. Package ID/title are resolved from the approved published record.
- Related reads/writes receive the original Payload request so contact and inquiry changes participate in the same transaction. Local SQLite transactions are enabled.
- Rejected submissions are tested to leave no orphan contact or partial customer update. Authorized staff can continue editing lead status and internal notes.

Main files: `src/lib/publicInquiry.ts`, `src/collections/Inquiries.ts`, `src/lib/analyticsCollection.ts`, `payload.config.ts`, and InquiryForm.

### Preview authorization

- Raw preview-secret URLs and the fallback to the authentication signing key were removed.
- Preview links use an HMAC signature, a 15-minute expiry, and an exact page path. A link for one site/page does not unlock another.
- A dedicated `PREVIEW_SECRET` of at least 32 characters, different from `PAYLOAD_SECRET`, is required. Otherwise previews fail closed.
- Admin preview generation requires an authenticated user, and package previews resolve an ID-only site relationship correctly.
- Preview responses have no-store, no-referrer, and noindex controls. Their metadata is generated using the authorized draft context.
- Existing raw-secret preview links no longer authorize drafts; editors must generate new links.

Main files: `src/lib/preview.ts`, admin preview callbacks, public page routes, and `next.config.mjs`.

### Dependency upgrades and runtime

| Component | Previous lockfile version | Updated version |
| --- | --- | --- |
| Payload and associated CMS/database/storage packages | 3.88.0 | 3.93.0 |
| Next.js | 15.4.11 | 16.4.6 |
| React and React DOM | 19.1.0 | 19.3.1 |
| Sharp | 0.34.5 | 0.35.5 |
| DOMPurify | 3.4.8 | 3.4.17 |
| Happy DOM | Vulnerable transitive release | 21.0.4 |
| esbuild used by the legacy SQL tooling loader | 0.18.20 | 0.25.12 |

The latest patched Payload peer requirements required a compatible Next.js 16 upgrade. Next.js scripts explicitly use webpack for the existing Payload integration. Next-generated TypeScript settings were retained.

Use Node **24.22.1 or a newer 24.x release**, recorded in `.nvmrc` and package engines. Verification used a temporary matching Node runtime; the computer's system-wide Node installation was not changed.

All related Payload versions are aligned and pinned. Targeted overrides patch sanitizer/parser/tooling dependencies whose parent packages still selected vulnerable versions. A fresh lockfile installation was verified with `npm ci`; the obsolete esbuild copy was removed.

## Dependency audit result

The final `npm audit --omit=dev` snapshot reports:

| Severity | Affected package entries |
| --- | ---: |
| Critical | 0 |
| High | 0 |
| Moderate | 0 |
| Low | 11 |

The remaining low entries all derive from the `deepmerge` advisory and its propagation through parent packages. The currently published upstream release is still affected; a safe compatible patch was not available in the checked dependency set. Automatic recommendations to downgrade Payload to obsolete releases were not applied. This is not a zero-advisory dependency tree.

Counts describe registry package entries, including transitive/parent relationships, rather than independently demonstrated exploits. Preserve and recheck the accompanying `security-dependencies-2026-11-12.json` snapshot before release.

## Verification

- **44 automated tests passed**, including navigation, analytics, draft access, private parent sites, customer integrity, invalid submissions, transaction rollback, preview expiry/tampering/path scope, editor HTML parsing, and image resizing/encoding.
- TypeScript validation passed.
- The isolated production build passed, and production HTTP checks covered public pages, draft page rejection, REST/GraphQL/version access, preview routes, real inquiry submission, login, and the authenticated dashboard.
- `git diff --check` passed.

The test harness uses generated test accounts and a fresh temporary SQLite database. Hosted database URLs and Blob tokens are explicitly cleared. No real leads/content were changed, and the production schema-sync build script was not invoked.

Repeatable commands using the required Node runtime:

```bash
npm ci
npm test
npm run typecheck
node --import tsx scripts/verify-security.mjs
npm audit --omit=dev
```

The production verifier builds directly with `next build --webpack`, starts a local production server, exercises HTTP behavior, and removes its temporary database. The resulting `.next` directory is a local test artifact, not a deployment artifact for the real environment.

## Before deployment

1. Select a supported Node 24.x runtime that meets the minimum version.
2. Configure or verify a separate, strong `PREVIEW_SECRET`. Do not paste its value into a URL or share it with editors.
3. If the authentication key was previously used in shared/logged preview URLs, rotate it and invalidate affected sessions as part of release preparation.
4. Back up the production database and validate the dependency upgrade with a separate staging Postgres database and Blob store. The automated integration tests used SQLite; actual hosted upload and Postgres behavior remain staging acceptance checks.
5. Review the current hosted schema-sync build step before production rollout. It remains a separate audit finding and was not exercised here.
6. Deploy through the normal release process, then verify publishing, inquiries, media, login, and new preview links with a staging/production test account.

The implementation was verified locally. Deployment status should be checked against the release commit. This addresses the requested critical batch; client isolation, role design, distributed abuse protection, recovery email, retention, and the remaining production-readiness items are not claimed complete.
