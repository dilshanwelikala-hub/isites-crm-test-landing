# Test Landing CMS

This is a multi-site Web CMS prototype built with Next.js and Payload CMS.

## What it includes

- Public landing page at `/`
- Multi-site public pages at `/sites/[siteSlug]`
- Payload admin panel at `/admin`
- Sites collection for managing multiple client websites
- Client site template presets for resort/hotel, restaurant, event/venue, and service businesses
- Editable landing page global content
- Editable package cards with draft/published workflow
- Draft preview links for homepage and package edits
- Basic lead/contact management from package inquiry forms
- CRM-style dashboard with pipeline stages, recent leads, and follow-up indicators
- Local media uploads
- Local SQLite database for the first test build
- Hosted Postgres support for Vercel deployments
- Hosted media upload support through Vercel Blob
- Image-only media library with thumbnails, focal point control, and site assignment
- Per-site analytics for page views, selected CTA clicks, referrers, and saved website inquiries

## Site analytics

Open `CMS > Sites > [site] > Analytics`, or use the Analytics link on a site workspace.
The default site has its own independent report. Reports include UTC date filters (7, 30,
90 days or a custom range up to 90 days), daily activity, top pages, button clicks,
estimated visitors, attributed inquiries, and visitor conversion.

Tracking is **off by default**. In the site's editor, enable `Analytics Enabled` and publish
the site. For the default site, enable and publish this setting in Landing Page instead.
Review the site's privacy notice and any applicable consent requirements before enabling
tracking. This implementation is not a consent-management platform.

An estimated visitor is a browser-tab session, not a unique person. A random identifier
is held in sessionStorage and stored server-side only as a site-specific HMAC. Analytics
does not store cookies, IP addresses, form contents, link destinations, URL query strings,
or full referrer URLs. Only external referrer hostnames are retained. Do Not Track,
Global Privacy Control, preview URLs, authenticated editors, and obvious bots are excluded.
Blocked scripts or unavailable storage reduce the measured totals.

The tracked actions are hero, package primary/secondary/detail, announcement, newsletter,
phone, and email links. Clicks measure interactions, not confirmed bookings or newsletter
subscriptions. Inquiry counts come from successfully saved records with a verified page
token; manual CRM records and failed submissions are excluded. Conversion is the percentage
of measured visitor sessions in the period that also have an attributed inquiry in that period.
Repeated inquiries from one session do not inflate conversion.

The public collector accepts only signed, expiring same-origin page tokens, deduplicates
page views and event retries, and accepts at most 100 events per page token. Raw events
cannot be created, edited, or read anonymously through the Payload API. The per-token cap
is not a substitute for a production firewall or distributed abuse protection.

This MVP covers the pages served by this app, not arbitrary externally hosted sites.
It starts collecting only after deployment and enablement, with no historical backfill.
Reports are bounded at 50,000 events/inquiries per collection; larger reports require a
shorter range. Raw events currently have no automatic retention cleanup. Establish a
retention policy, database backups, and scheduled cleanup before high-volume production use;
aggregate storage or a dedicated analytics service is a future scaling step.

The schema adds the `analytics-events` collection, per-site/default-site enable flags,
and inquiry attribution fields. The existing Vercel build schema-sync step applies these
changes to Postgres. Back up and validate this schema update in staging before production.
The local integration test uses a fresh temporary SQLite database and never loads hosted
database credentials:

```bash
node --import tsx --test tests/adminNavigation.test.ts tests/analytics.test.ts
node --import tsx --test tests/analytics.integration.ts
```

## Local setup

1. Install dependencies:

   ```bash
   npm install
   ```

2. Start the project:

   ```bash
   npm run dev
   ```

3. Open:

   ```text
   http://localhost:3000
   ```

4. Create the first admin user:

   ```text
   http://localhost:3000/admin
   ```

## Editing content

In the admin panel:

- Edit the overall page copy under `Globals > Landing Page`
- Create and manage client websites under `Sites > Sites`
- Choose a site template key such as `resort`, `restaurant`, `event`, or `service` when creating a site
- Add package cards under `Landing Page > Landing Packages`
- Assign package cards, media, inquiries, and contacts to a site when they belong to a client website
- Set package records to `Published` to show them on the public page
- Upload images under `Media`
- Add alt text, usage notes, source credits, tags, and site assignment for uploaded media
- Review incoming leads under `Lead Management > Inquiries`
- View automatically created contacts under `Lead Management > Contacts`

The default public page includes fallback content so it looks complete before CMS records are added.
Site records can be viewed at `/sites/[siteSlug]`, for example `/sites/test-resort` after seeding demo data.

When a site is first created, the selected template key applies starter content, section labels, theme colors, footer defaults, and SEO defaults. Editors can then adjust that content for the actual client.

## Demo content

To populate the CMS with the packaged demo content, run:

```bash
npm run seed
```

The seed command publishes the default landing page settings, creates a demo site at `/sites/test-resort`, adds site-specific package records, and adds sample inquiries so the lead dashboard has realistic demo data.

## Vercel database

For hosted editing, connect a Neon Postgres database in Vercel and make sure the project has either:

```text
DATABASE_URL
```

or:

```text
POSTGRES_URL
```

When either variable exists, Payload uses Postgres. Without one, local development falls back to SQLite.

The build command runs a small schema sync before `next build` whenever hosted Postgres is configured. This creates the initial Payload tables for the Vercel demo database.

## Draft preview

Set a preview token locally and in Vercel:

```text
PREVIEW_SECRET
```

Editors can use Payload's Preview action from the homepage global, site records, or package records. Preview URLs include the token and show draft content without exposing drafts to normal visitors.

## Hosted media uploads

For persistent media on Vercel, connect Vercel Blob storage to the project. Vercel should add:

```text
BLOB_READ_WRITE_TOKEN
```

When this variable exists, the `media` collection stores uploads in Vercel Blob. Without it, local development continues to use local media storage.

If image uploads fail on Vercel, confirm the Blob store is connected to this Vercel project and that `BLOB_READ_WRITE_TOKEN` exists for Production and Preview environments.

The CMS media library accepts image uploads and creates smaller versions for thumbnails, cards, hero sections, and Open Graph previews. Each media item can be assigned to a site so client assets stay easier to filter and manage.

## Production URLs

Set this variable in Vercel when using a custom domain or stable public URL:

```text
PAYLOAD_PUBLIC_SITE_URL
```

For the current preview deployment, this should be:

```text
https://isites-crm-test-landing.vercel.app
```

Preview links use this URL first. On Vercel, the app can also fall back to Vercel's production project URL so admin preview links do not point at old deployment-specific URLs.
