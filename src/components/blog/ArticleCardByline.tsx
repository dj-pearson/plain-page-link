import type { ArticleAuthor } from '@/lib/articleAuthor';

interface ArticleCardBylineProps {
  author: ArticleAuthor | undefined;
}

/**
 * Who wrote an article, on a blog list card (US-399).
 *
 * Plain text, not a link to the author's page: on /blog the whole card is
 * already a link, and a link inside a link is invalid HTML. The article page
 * carries the linked byline and the schema.org Person. Renders nothing when
 * the author did not resolve, rather than a role or a placeholder name.
 */
export const ArticleCardByline = ({ author }: ArticleCardBylineProps) => {
  if (!author) return null;
  return <p className="text-sm font-medium text-foreground">By {author.name}</p>;
};
