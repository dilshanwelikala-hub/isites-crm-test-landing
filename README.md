# Test Landing CMS

This is a simple editable landing page prototype built with Next.js and Payload CMS.

## What it includes

- Public landing page at `/`
- Payload admin panel at `/admin`
- Editable landing page global content
- Editable package cards with draft/published workflow
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

The public page includes fallback content so it looks complete before CMS records are added.

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
