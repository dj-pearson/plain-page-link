import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTopPages } from '@/hooks/useSearchAnalytics';
import type { SearchPlatform } from '@/types/searchAnalytics';

interface TopPagesTableProps {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
  limit?: number;
}

export function TopPagesTable({ startDate, endDate, platforms, limit = 10 }: TopPagesTableProps) {
  const topPages = useTopPages({ startDate, endDate, platforms, limit });

  if (!topPages || topPages.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No page data available for the selected period</p>
        <p className="text-sm mt-2">Connect platforms and sync data to see top pages</p>
      </div>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatPercent = (num: number) => {
    return `${(num * 100).toFixed(2)}%`;
  };

  const getTrendIcon = (change: number) => {
    if (change > 0) return <TrendingUp className="h-3 w-3 text-green-600" />;
    if (change < 0) return <TrendingDown className="h-3 w-3 text-red-600" />;
    return <Minus className="h-3 w-3 text-muted-foreground" />;
  };

  const truncateUrl = (url: string, maxLength = 50) => {
    if (url.length <= maxLength) return url;
    return url.substring(0, maxLength) + '...';
  };

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[35%]">Page</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Sessions</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Position</TableHead>
            <TableHead className="text-right">Trend</TableHead>
            <TableHead className="w-[50px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topPages.map((page, index) => (
            <TableRow key={`${page.url}-${index}`}>
              <TableCell className="max-w-xs">
                <div className="flex flex-col">
                  <span className="font-medium text-sm truncate" title={page.url}>
                    {truncateUrl(page.url)}
                  </span>
                  {page.title && (
                    <span className="text-xs text-muted-foreground truncate" title={page.title}>
                      {page.title}
                    </span>
                  )}
                </div>
              </TableCell>
              <TableCell className="text-right">{formatNumber(page.clicks)}</TableCell>
              <TableCell className="text-right">{formatNumber(page.sessions)}</TableCell>
              <TableCell className="text-right">{formatNumber(page.impressions)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{formatPercent(page.ctr)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{page.position.toFixed(1)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  {getTrendIcon(page.change)}
                </div>
              </TableCell>
              <TableCell>
                <a
                  href={page.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:text-primary/80"
                >
                  <ExternalLink className="h-4 w-4" />
                </a>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
