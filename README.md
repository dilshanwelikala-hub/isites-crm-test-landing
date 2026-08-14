# Test Landing CMS

This is a simple editable landing page prototype built with Next.js and Payload CMS.

## What it includes

- Public landing page at `/`
- Payload admin panel at `/admin`
- Editable landing page global content
- Editable package cards with draft/published workflow
- Local media uploads
- Local SQLite database for the first test build

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
