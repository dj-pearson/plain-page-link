import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { useTopQueries } from '@/hooks/useSearchAnalytics';
import type { SearchPlatform } from '@/types/searchAnalytics';

interface TopQueriesTableProps {
  startDate: string;
  endDate: string;
  platforms?: SearchPlatform[];
  limit?: number;
}

export function TopQueriesTable({ startDate, endDate, platforms, limit = 10 }: TopQueriesTableProps) {
  const topQueries = useTopQueries({ startDate, endDate, platforms, limit });

  if (!topQueries || topQueries.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <p>No query data available for the selected period</p>
        <p className="text-sm mt-2">Connect platforms and sync data to see top queries</p>
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

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[40%]">Query</TableHead>
            <TableHead className="text-right">Clicks</TableHead>
            <TableHead className="text-right">Impressions</TableHead>
            <TableHead className="text-right">CTR</TableHead>
            <TableHead className="text-right">Position</TableHead>
            <TableHead className="text-right">Trend</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {topQueries.map((query, index) => (
            <TableRow key={`${query.query}-${index}`}>
              <TableCell className="font-medium max-w-xs truncate">
                {query.query}
              </TableCell>
              <TableCell className="text-right">{formatNumber(query.clicks)}</TableCell>
              <TableCell className="text-right">{formatNumber(query.impressions)}</TableCell>
              <TableCell className="text-right">
                <Badge variant="outline">{formatPercent(query.ctr)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <Badge variant="secondary">{query.position.toFixed(1)}</Badge>
              </TableCell>
              <TableCell className="text-right">
                <div className="flex justify-end">
                  {getTrendIcon(query.change)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
