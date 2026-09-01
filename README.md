# Test Landing CMS

This is a simple editable landing page prototype built with Next.js and Payload CMS.

## What it includes

- Public landing page at `/`
- Payload admin panel at `/admin`
- Editable landing page global content
- Editable package cards with draft/published workflow
- Draft preview links for homepage and package edits
- Basic lead/contact management from package inquiry forms
- CRM-style dashboard with pipeline stages, recent leads, and follow-up indicators
- Local media uploads
- Local SQLite database for the first test build
- Hosted Postgres support for Vercel deployments

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
- Add package cards under `Landing Page > Landing Packages`
- Set package records to `Published` to show them on the public page
- Upload images under `Media`
- Review incoming leads under `Lead Management > Inquiries`
- View automatically created contacts under `Lead Management > Contacts`

The public page includes fallback content so it looks complete before CMS records are added.

## Demo content

To populate the CMS with the packaged demo content, run:

```bash
npm run seed
```

The seed command publishes the landing page settings and the sample offers. It can also update existing seeded records by slug.
It also adds sample inquiries so the lead dashboard has realistic demo data.

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

Editors can use Payload's Preview action from the homepage global or package records. Preview URLs include the token and show draft content without exposing drafts to normal visitors.

## Hosted media uploads

For persistent media on Vercel, connect Vercel Blob storage to the project. Vercel should add:

```text
BLOB_READ_WRITE_TOKEN
```

When this variable exists, the `media` collection stores uploads in Vercel Blob. Without it, local development continues to use local media storage.
