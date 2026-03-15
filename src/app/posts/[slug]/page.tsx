import Link from "next/link";
import MarkdownContent from "@/components/MarkdownContent";
import { getAllPostSlugs, getPostBySlug } from "@/lib/posts";

export const dynamicParams = false;

export function generateStaticParams(): Array<{ slug: string }> {
  return getAllPostSlugs().map((slug) => ({ slug }));
}

type PostPageProps = {
  params: { slug: string } | Promise<{ slug: string }>;
};

export default async function PostPage({ params }: PostPageProps) {
  const resolvedParams = await params;
  const slug = resolvedParams?.slug;

  if (!slug) {
    throw new Error("Post slug is missing for this page.");
  }

  const { frontmatter, content } = getPostBySlug(slug);

  return (
    <div className="flex flex-col min-h-screen">
      <section className="py-24 px-6 md:px-12 max-w-3xl mx-auto w-full">
        <Link
          href="/posts"
          className="text-sm flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors mb-10"
        >
          Back to posts
        </Link>
        <header className="mb-12">
          <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted-foreground)] mb-4">
            {frontmatter.date}
          </p>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight mb-4">
            {frontmatter.title}
          </h1>
          <p className="text-lg text-[var(--muted-foreground)] leading-relaxed">
            {frontmatter.description}
          </p>
        </header>
        <MarkdownContent source={content} />
      </section>
    </div>
  );
}
