import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Search,
  AlertCircle,
} from "lucide-react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Keyword {
  id: string;
  keyword: string;
  current_position: number;
  previous_position: number;
  search_volume: number;
  difficulty: number;
  url: string;
  last_checked: string;
  created_at: string;
}

interface KeywordHistory {
  keyword: string;
  position: number;
  checked_at: string;
}

export const KeywordsTracker = () => {
  const { toast } = useToast();
  const [keywords, setKeywords] = useState<Keyword[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
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
        title: "Error",
        description: error.message,
        variant: "destructive",
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
      console.error('Error loading keyword history:', error);
    }
  };

  const checkKeywordPositions = async () => {
    setLoading(true);
    try {
      const { error } = await supabase.functions.invoke('check-keyword-positions', {
        body: {},
      });

      if (error) throw error;

      toast({
        title: "Positions Updated",
        description: "Keyword positions have been refreshed",
      });

      await loadKeywords();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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

  const filteredKeywords = keywords.filter(kw =>
    kw.keyword.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const topMovers = keywords
    .filter(kw => kw.previous_position && kw.current_position !== kw.previous_position)
    .sort((a, b) => (b.previous_position - b.current_position) - (a.previous_position - a.current_position))
    .slice(0, 5);

  const topRanked = keywords.filter(kw => kw.current_position <= 10);
  const needsAttention = keywords.filter(kw => kw.current_position > 20 && kw.search_volume > 100);

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
            <div className="text-3xl font-bold text-green-600">
              {topRanked.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keywords in top 10
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">Biggest Gain</CardTitle>
          </CardHeader>
          <CardContent>
            {topMovers.length > 0 && topMovers[0].current_position < topMovers[0].previous_position ? (
              <>
                <div className="text-3xl font-bold text-green-600">
                  +{topMovers[0].previous_position - topMovers[0].current_position}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {topMovers[0].keyword}
                </p>
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
            <div className="text-3xl font-bold text-yellow-600">
              {needsAttention.length}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Keywords to optimize
            </p>
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
          <CardDescription>
            {filteredKeywords.length} keywords found
          </CardDescription>
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
                  <TableHead>URL</TableHead>
                  <TableHead>Last Checked</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredKeywords.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center text-muted-foreground">
                      No keywords found
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredKeywords.map((keyword) => (
                    <TableRow key={keyword.id}>
                      <TableCell className="font-medium">{keyword.keyword}</TableCell>
                      <TableCell>
                        <Badge variant={keyword.current_position <= 10 ? "default" : "outline"}>
                          #{keyword.current_position}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {getTrendIcon(keyword.current_position, keyword.previous_position || keyword.current_position)}
                          {getPositionChange(keyword.current_position, keyword.previous_position || keyword.current_position)}
                        </div>
                      </TableCell>
                      <TableCell>{keyword.search_volume?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{getDifficultyBadge(keyword.difficulty || 0)}</TableCell>
                      <TableCell className="max-w-xs truncate">
                        {keyword.url || '-'}
                      </TableCell>
                      <TableCell>
                        {keyword.last_checked
                          ? new Date(keyword.last_checked).toLocaleDateString()
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
            <CardDescription>
              Ranking positions over the last 30 checks
            </CardDescription>
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
            <CardDescription>
              Keywords with the biggest position changes
            </CardDescription>
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
                    {getTrendIcon(keyword.current_position, keyword.previous_position)}
                    <div className="text-right">
                      <div className="font-bold">
                        {getPositionChange(keyword.current_position, keyword.previous_position)}
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
