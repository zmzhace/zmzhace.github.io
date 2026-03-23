# Markdown Posts Support Design

Date: 2026-03-15

## Overview
Enable a Markdown-based blog system where placing `.mdx` (or `.md`) files in `/posts` automatically generates a `/posts` list page and `/posts/[slug]` detail pages. The system must work with the current Next.js App Router setup and `output: "export"` static export.

**Rendering choice:** use `next-mdx-remote/rsc` (App Router compatible) so rendering happens in server components during build. Plain `.md` files will be treated the same way (compiled through the MDX pipeline, without custom components).

## Goals
- Provide a simple authoring flow: drop Markdown files into `/posts`.
- Parse frontmatter with **title, date, description**.
- Generate a list page at `/posts` (sorted by date desc).
- Generate a detail page at `/posts/[slug]` for each post.
- Work in static export mode with no server runtime.

## Non-goals
- Remote content sources (CMS, API, database).
- Rich MDX components library beyond defaults.
- Tag/category pages (can be added later).
- Draft/private posts handling (not supported initially).

## Architecture

### Content Layout
```
/posts
  hello-world.mdx
  another-post.mdx
```

### File Types
- `.mdx` and `.md` are both accepted.
- `.md` is compiled through the same MDX pipeline (no custom components), ensuring a single rendering path.

### Routing
- `/posts` → list page
- `/posts/[slug]` → detail page

### Data Flow
1. Read files from `/posts` at build time **in server components only**.
2. Use `gray-matter` to parse frontmatter.
3. Validate frontmatter:
   - `title` and `description` are non-empty strings.
   - `date` must be ISO-8601 (`YYYY-MM-DD`) to guarantee stable sorting.
   - Slugs must be unique; duplicate slugs cause a build-time error.
4. Render Markdown/MDX content with `next-mdx-remote/rsc`.
5. Sort posts by `date` (desc) for the list page.
6. Provide `generateStaticParams` for `[slug]` routes.

## Components / Files
- `lib/posts.ts` — file discovery, frontmatter parsing, validation, and content loading.
- `app/posts/page.tsx` — list page.
- `app/posts/[slug]/page.tsx` — detail page.
- Optional: `components/MarkdownContent.tsx` — render MDX content (no custom components initially; can be added later).

## Error Handling
- Missing required frontmatter fields (`title`, `date`, `description`) throws a build-time error indicating the file.
- Unknown slug returns 404 (via `notFound()` in Next.js).

## Rendering & Export
- Use static generation only.
- Ensure all pages are compatible with `output: "export"`.

## Testing / Verification
- No automated tests are added (project currently has no test setup).
- Manual verification via `next build` and a sample Markdown file.

## Example Frontmatter
```
---
title: "Hello World"
date: "2026-03-01"
description: "My first post"
---
```
