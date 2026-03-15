import { MDXRemote } from "next-mdx-remote/rsc";

type MarkdownContentProps = {
  source: string;
};

export default function MarkdownContent({ source }: MarkdownContentProps) {
  return (
    <article className="prose prose-neutral dark:prose-invert max-w-none">
      <MDXRemote source={source} />
    </article>
  );
}
