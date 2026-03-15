import Link from "next/link";
import { getAllPosts } from "@/lib/posts";

export default function PostsPage() {
  const posts = getAllPosts();

  return (
    <div className="flex flex-col min-h-screen">
      <section className="py-24 px-6 md:px-12 max-w-5xl mx-auto w-full">
        <div className="flex items-center justify-between mb-10">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-[var(--muted-foreground)] mb-3">Blog</p>
            <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">Latest Writings</h1>
          </div>
          <Link
            href="/"
            className="text-sm flex items-center gap-2 text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
          >
            Back home
          </Link>
        </div>

        {posts.length === 0 ? (
          <div className="border border-dashed border-[var(--border)] rounded-2xl p-12 text-center text-[var(--muted-foreground)]">
            No posts yet.
          </div>
        ) : (
          <div className="grid gap-6">
            {posts.map((post) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group border border-[var(--border)] rounded-2xl p-6 hover:border-[var(--muted-foreground)] transition-colors"
              >
                <div className="flex items-center gap-3 text-sm text-[var(--muted-foreground)] mb-3">
                  <span>{post.date}</span>
                </div>
                <h2 className="text-xl font-medium mb-2 group-hover:underline decoration-[var(--muted-foreground)] underline-offset-4">
                  {post.title}
                </h2>
                <p className="text-[var(--muted-foreground)] leading-relaxed">
                  {post.description}
                </p>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
