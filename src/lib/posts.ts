import "server-only";
import fs from "fs";
import path from "path";
import matter from "gray-matter";

export type PostFrontmatter = {
  title: string;
  date: string;
  description: string;
};

export type PostSummary = PostFrontmatter & {
  slug: string;
};

const POSTS_DIR = path.join(process.cwd(), "posts");
const DATE_FORMAT = /^\d{4}-\d{2}-\d{2}$/;

function getPostsDirExists(): boolean {
  try {
    return fs.existsSync(POSTS_DIR);
  } catch {
    return false;
  }
}

function assertFrontmatter(slug: string, data: Record<string, unknown>): PostFrontmatter {
  const title = data.title;
  const date = data.date;
  const description = data.description;

  if (typeof title !== "string" || title.trim().length === 0) {
    throw new Error(`Post "${slug}" is missing required frontmatter field "title".`);
  }

  if (typeof date !== "string" || date.trim().length === 0) {
    throw new Error(`Post "${slug}" is missing required frontmatter field "date".`);
  }

  if (!DATE_FORMAT.test(date)) {
    throw new Error(
      `Post "${slug}" has invalid "date" format. Expected YYYY-MM-DD.`
    );
  }

  if (typeof description !== "string" || description.trim().length === 0) {
    throw new Error(`Post "${slug}" is missing required frontmatter field "description".`);
  }

  return {
    title,
    date,
    description,
  };
}

function getPostFilePath(slug: string): string | null {
  const mdxPath = path.join(POSTS_DIR, `${slug}.mdx`);
  if (fs.existsSync(mdxPath)) {
    return mdxPath;
  }

  const mdPath = path.join(POSTS_DIR, `${slug}.md`);
  if (fs.existsSync(mdPath)) {
    return mdPath;
  }

  return null;
}

export function getAllPostSlugs(): string[] {
  if (!getPostsDirExists()) {
    return [];
  }

  const entries = fs.readdirSync(POSTS_DIR, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => entry.name)
    .filter((name) => name.endsWith(".md") || name.endsWith(".mdx"))
    .map((name) => name.replace(/\.(md|mdx)$/i, ""));
}

export function getAllPosts(): PostSummary[] {
  const slugs = getAllPostSlugs();
  const seenSlugs = new Set<string>();

  const posts = slugs.map((slug) => {
    if (seenSlugs.has(slug)) {
      throw new Error(`Duplicate post slug detected: "${slug}".`);
    }
    seenSlugs.add(slug);

    const filePath = getPostFilePath(slug);
    if (!filePath) {
      throw new Error(`Post file not found for slug "${slug}".`);
    }

    const fileContents = fs.readFileSync(filePath, "utf8");
    const { data } = matter(fileContents);
    const frontmatter = assertFrontmatter(slug, data);

    return {
      slug,
      ...frontmatter,
    };
  });

  return posts.sort((a, b) => b.date.localeCompare(a.date));
}

export function getPostBySlug(slug: string): { frontmatter: PostFrontmatter; content: string } {
  const filePath = getPostFilePath(slug);
  if (!filePath) {
    throw new Error(`Post not found for slug "${slug}".`);
  }

  const fileContents = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(fileContents);
  const frontmatter = assertFrontmatter(slug, data);

  return {
    frontmatter,
    content,
  };
}
