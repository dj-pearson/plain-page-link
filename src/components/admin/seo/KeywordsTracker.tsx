import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { edgeFunctions } from '@/lib/edgeFunctions';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TrendingUp, TrendingDown, Minus, RefreshCw, Search, AlertCircle } from 'lucide-react';
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { logger } from '@/lib/logger';
import type { Database } from '@/integrations/supabase/types';

/**
 * A row from `seo_keywords`, exactly as stored.
 *
 * Restated by hand this named three columns the table does not have —
 * `difficulty` (it is `difficulty_score`), `last_checked` (`last_checked_at`)
 * and `url` (no such column on seo_keywords at all) — so the Difficulty, URL
 * and Last Checked cells rendered from undefined on every row: every keyword
 * showed the "Easy" badge, a dash for URL and "Never" for last checked,
 * whatever the database held. It also typed every position and volume column
 * non-nullable when all of them are nullable.
 */
type Keyword = Database['public']['Tables']['seo_keywords']['Row'];

/** Exactly the `seo_keyword_history` columns this panel selects. */
type KeywordHistory = Pick<
  Database['public']['Tables']['seo_keyword_history']['Row'],
  'keyword' | 'position' | 'checked_at'
>;

export const KeywordsTracker = () => {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedKeyword, setSelectedKeyword] = useState<Keyword | null>(null);
  const [keywordHistory, setKeywordHistory] = useState<KeywordHistory[]>([]);

  useEffect(() => {
    loadKeywords();
  }, []);

  const loadKeywords = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('seo_keywords')
        .select('*')
        .order('current_position', { ascending: true });

      if (error) throw error;
      setKeywords(data || []);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const loadKeywordHistory = async (keyword: string) => {
    try {
      const { data, error } = await supabase
        .from('seo_keyword_history')
        .select('keyword, position, checked_at')
        .eq('keyword', keyword)
        .order('checked_at', { ascending: true })
        .limit(30);

      if (error) throw error;
      setKeywordHistory(data || []);
    } catch (error: any) {
      logger.error('Error loading keyword history', error);
    }
  };

  const checkKeywordPositions = async () => {
    setLoading(true);
    try {
      const { error } = await edgeFunctions.invoke('check-keyword-positions', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: 'Positions Updated',
        description: 'Keyword positions have been refreshed',
      });

      await loadKeywords();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const getTrendIcon = (current: number, previous: number) => {
    if (current < previous) {
      return <TrendingUp className="h-4 w-4 text-green-500" />;
    } else if (current > previous) {
      return <TrendingDown className="h-4 w-4 text-red-500" />;
    } else {
      return <Minus className="h-4 w-4 text-gray-500" />;
    }
  };

  const getPositionChange = (current: number, previous: number) => {
    const change = previous - current;
    if (change > 0) {
      return <span className="text-green-600">+{change}</span>;
    } else if (change < 0) {
      return <span className="text-red-600">{change}</span>;
    } else {
      return <span className="text-gray-500">0</span>;
    }
  };

  const getDifficultyBadge = (difficulty: number) => {
    if (difficulty >= 70) return <Badge variant="destructive">Hard</Badge>;
    if (difficulty >= 40) return <Badge variant="default">Medium</Badge>;
    return <Badge variant="secondary">Easy</Badge>;
  };

  const filteredKeywords = keywords.filter((kw) =>
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const gain = (kw: Keyword) => (kw.previous_position ?? 0) - (kw.current_position ?? 0);

  const topMovers = keywords
    .filter(
      (kw) =>
        kw.previous_position !== null &&
        kw.current_position !== null &&
        kw.current_position !== kw.previous_position
    )
    .sort((a, b) => gain(b) - gain(a))
    .slice(0, 5);

  const topRanked = keywords.filter(
    (kw) => kw.current_position !== null && kw.current_position <= 10
  );
  const needsAttention = keywords.filter(
    (kw) => (kw.current_position ?? 0) > 20 && (kw.search_volume ?? 0) > 100
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold">Keywords Tracker</h3>
          <p className="text-muted-foreground">
            Monitor keyword rankings and track position changes
          </p>
        </div>
        <Button onClick={checkKeywordPositions} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Check Positions
        </Button>
      </div>

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Total Keywords</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{keywords.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Being tracked</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Top 10 Rankings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{topRanked.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Keywords in top 10</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Biggest Gain</CardTitle>
          </CardHeader>
          <CardContent>
            {topMovers.length > 0 && gain(topMovers[0]) > 0 ? (
              <>
                <div className="text-3xl font-bold text-green-600">+{gain(topMovers[0])}</div>
                <p className="text-xs text-muted-foreground mt-1">{topMovers[0].keyword}</p>
              </>
            ) : (
              <div className="text-3xl font-bold text-gray-400">-</div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-1">
              <AlertCircle className="h-4 w-4" />
              Needs Attention
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-yellow-600">{needsAttention.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Keywords to optimize</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search keywords..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Keywords Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Keywords</CardTitle>
          <CardDescription>{filteredKeywords.length} keywords found</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="overflow-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Keyword</TableHead>
                  <TableHead>Position</TableHead>
                  <TableHead>Change</TableHead>
                  <TableHead>Search Volume</TableHead>
                  <TableHead>Difficulty</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center text-muted-foreground">
                      No keywords found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            keyword.current_position !== null && keyword.current_position <= 10
                              ? 'default'
                              : 'outline'
                          }
                        >
                          {keyword.current_position === null
                            ? 'Unranked'
                            : `#${keyword.current_position}`}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(
                            keyword.current_position ?? 0,
                            keyword.previous_position ?? keyword.current_position ?? 0
                          )}
                          {getPositionChange(
                            keyword.current_position ?? 0,
                            keyword.previous_position ?? keyword.current_position ?? 0
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{getDifficultyBadge(keyword.difficulty_score ?? 0)}</TableCell>
                      <TableCell>
                        {keyword.last_checked_at
                          ? new Date(keyword.last_checked_at).toLocaleDateString()
                          : 'Never'}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedKeyword(keyword);
                            loadKeywordHistory(keyword.keyword);
                          }}
                        >
                          View History
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Keyword History Modal/Card */}
      {selectedKeyword && (
        <Card>
          <CardHeader>
            <CardTitle>Position History: {selectedKeyword.keyword}</CardTitle>
            <CardDescription>Ranking positions over the last 30 checks</CardDescription>
          </CardHeader>
          <CardContent>
            {keywordHistory.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={keywordHistory}>
                  <XAxis
                    dataKey="checked_at"
                    tickFormatter={(date) => new Date(date).toLocaleDateString()}
                  />
                  <YAxis reversed domain={[0, 100]} />
                  <Tooltip
                    labelFormatter={(date) => new Date(date).toLocaleDateString()}
                    formatter={(value: number) => [`Position ${value}`, 'Rank']}
                  />
                  <Line
                    type="monotone"
                    dataKey="position"
                    stroke="#2563eb"
                    strokeWidth={2}
                    dot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                No history available for this keyword
              </p>
            )}
            <div className="mt-4">
              <Button variant="outline" onClick={() => setSelectedKeyword(null)}>
                Close
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Movers */}
      {topMovers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Top Movers</CardTitle>
            <CardDescription>Keywords with the biggest position changes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMovers.map((keyword) => (
                <div
                  key={keyword.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <h4 className="font-semibold">{keyword.keyword}</h4>
                    <p className="text-sm text-muted-foreground">
                      Position: #{keyword.current_position}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {getTrendIcon(keyword.current_position ?? 0, keyword.previous_position ?? 0)}
                    <div className="text-right">
                      <div className="font-bold">
                        {getPositionChange(
                          keyword.current_position ?? 0,
                          keyword.previous_position ?? 0
                        )}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {keyword.previous_position} → {keyword.current_position}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
