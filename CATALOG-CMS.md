# Catalog CMS — changing images and content yourself

**Admin → `/admin` → Catalog tab.** Password `tiruppur2026`.

Click any photo → media library opens → drop a new file or pick an existing one
→ the public page updates immediately. No rebuild, no developer, no deploy.

---

## What you can change

| | Category | Subcategory |
|---|---|---|
| Photo | ✅ hero banner | ✅ card + detail image |
| Title | ✅ | ✅ |
| Summary / blurb | ✅ | ✅ |
| Image alt text | ✅ | — |
| Show / hide | ✅ | ✅ |
| Revert to original | ✅ | ✅ |

Hiding removes the page, its sitemap entry and its search-index entry. Showing
puts all three back.

---

## The architecture, and why

`content/categories.json` stays the **seed**. It is version-controlled,
reviewable in a pull request, and is what a fresh install boots with. It is
**never written to**.

Everything you edit in the admin is stored separately in
`catalog_overrides` as a sparse patch. Reads merge `default ← override`.

```
content/categories.json   (seed, read-only)
          ↓  merge
catalog_overrides         (your edits, SQLite)
          ↓
     what the site shows
```

### Why not edit the JSON directly, the way Strapi-style tools do?

Three reasons, all of which bite in production:

1. **Merge conflicts.** A writable file in the repo means every content edit
   collides with every code change.
2. **No way back.** A bad save overwrites the original with nothing to restore.
   Here, deleting one row restores the seed *exactly* — verified by checksum.
3. **No audit trail.** Every field change is logged to `catalog_events` with
   old value, new value, who and when. Visible under **Show change log**.

Only whitelisted fields can be patched (`ALLOWED_CAT` / `ALLOWED_SUB` in
`src/lib/catalog.ts`). A crafted request cannot inject arbitrary keys.

Saving an empty value **deletes** that field from the patch, so the field falls
back to the seed. That is how per-field revert works.

---

## Uploads

Every upload is processed before it is stored:

| Step | Why |
|---|---|
| Decoded with sharp before anything is written | A file can claim `image/jpeg` and be a script. If it will not decode, it is rejected. |
| Re-encoded to **WebP** at quality 82 | A 281 KB JPEG tested at **11 KB** — 95% smaller. |
| Resized to max **2000px** wide | Anything larger is wasted bandwidth for banner use. |
| **EXIF stripped** (a side effect of re-encoding) | Phone photos routinely carry GPS coordinates. Those must not reach a public site. |
| 20px inline WebP placeholder generated | Cards never flash empty while loading. |
| Filename randomised | No collisions, no guessing other people's uploads. |

Limits: 12 MB, JPG / PNG / WebP / AVIF only.

Files land in `public/uploads/`. Deleting from the library removes the row and
the file.

> **Deploying serverlessly?** `public/uploads` is a local disk write, which
> Vercel and similar platforms do not persist. Swap the two `fs` calls in
> `src/app/api/admin/media/route.ts` for S3, R2 or Supabase Storage — nothing
> else changes.

---

## How the public site updates without a rebuild

Category and subcategory pages are statically generated for speed. On save the
API calls `revalidatePath()` for exactly the affected routes plus `/`,
`/what-we-make` and `/sitemap.xml`. Next.js regenerates those pages in the
background on the next request.

So you get static-page performance *and* instant edits.

---

## Adding a genuinely new category or subcategory

The admin edits existing entries. To **add** one, add it to
`content/categories.json` and deploy. That is deliberate: a new entry needs a
slug, SEO title, fabric list, branding list and considerations — fields that
belong in review, not in a text box.

Everything downstream is automatic: page, nav, sitemap, search index,
structured data, quote deep-link.

---

## Files

| Path | Role |
|---|---|
| `src/lib/catalog.ts` | Merge logic, patch writes, media records, audit |
| `src/app/api/admin/media/route.ts` | Upload, list, delete |
| `src/app/api/admin/catalog/route.ts` | Patch, revert, history, revalidation |
| `src/components/admin/CatalogEditor.tsx` | Catalog tab |
| `src/components/admin/MediaPicker.tsx` | Library + modal picker |
| `content/categories.json` | The seed. Never written to at runtime. |
