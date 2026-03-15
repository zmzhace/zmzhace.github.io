# Markdown Posts Support Design

Date: 2026-03-15

## Overview
Enable a Markdown-based blog system where placing `.mdx` (or `.md`) files in `/posts` automatically generates a `/posts` list page and `/posts/[slug]` detail pages. The system must work with the current Next.js App Router setup and `output: "export"` static export.

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

## Architecture

### Content Layout
```
/posts
  hello-world.mdx
  another-post.mdx
```

### Routing
- `/posts` → list page
- `/posts/[slug]` → detail page

### Data Flow
1. Read files from `/posts` at build time.
2. Use `gray-matter` to parse frontmatter.
3. Render Markdown/MDX content with `next-mdx-remote`.
4. Sort posts by `date` (desc) for the list page.
5. Provide static params for `[slug]` routes.

## Components / Files
- `lib/posts.ts` — file discovery, frontmatter parsing, and content loading.
- `app/posts/page.tsx` — list page.
- `app/posts/[slug]/page.tsx` — detail page.
- Optional: `components/MarkdownContent.tsx` — render MDX content.

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
