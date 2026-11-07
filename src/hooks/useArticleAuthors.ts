import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { getBaseUrl } from '@/config/seo.config';
import { logger } from '@/lib/logger';
import {
  ARTICLE_AUTHOR_COLUMNS,
  articleAuthorIds,
  resolveArticleAuthors,
  type ArticleAuthor,
  type ArticleAuthorRow,
} from '@/lib/articleAuthor';

const NO_ROWS: ArticleAuthorRow[] = [];

/**
 * Bylines for a list of articles, in ONE profiles request (US-399).
 *
 * The blog index and category pages list many articles; looking each card's
 * author up separately would be one request per card. This asks for the
 * distinct author ids with a single `id=in.(...)` filter, restricted to
 * published profiles for the same reason BlogArticle's lookup is (see
 * src/lib/articleAuthor.ts), and never fails the page: an error leaves every
 * card without a byline.
 */
export function useArticleAuthors(
  articles: ReadonlyArray<{ author_id: string | null }>
): Map<string, ArticleAuthor> {
  const ids = useMemo(() => articleAuthorIds(articles), [articles]);

  const { data: rows = NO_ROWS } = useQuery({
    queryKey: ['article-authors', ids],
    queryFn: async (): Promise<ArticleAuthorRow[]> => {
      const { data, error } = await supabase
        .from('profiles')
        .select(ARTICLE_AUTHOR_COLUMNS)
        .in('id', ids)
        .eq('is_published', true);
      if (error) {
        logger.debug('Article authors not resolved', { count: ids.length });
        return NO_ROWS;
      }
      return (data as ArticleAuthorRow[] | null) ?? NO_ROWS;
    },
    enabled: ids.length > 0,
    staleTime: 10 * 60 * 1000,
  });

  return useMemo(() => resolveArticleAuthors(rows, getBaseUrl()), [rows]);
}
