/**
 * ML Lead Scoring Dashboard
 *
 * Admin dashboard for managing ML lead scoring:
 * - A/B test visualization and controls
 * - Model performance metrics
 * - Feature importance analysis
 * - Historical test results
 */

import { useState, useEffect, useMemo } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useABTest, useMLModel, useMLLeadScoring } from '@/hooks/useMLLeadScoring';
import {
  Brain,
  FlaskConical,
  TrendingUp,
  TrendingDown,
  Play,
  Square,
  RefreshCw,
  Save,
  BarChart3,
  Target,
  Zap,
  AlertCircle,
  CheckCircle2,
  Clock,
  Users,
  Percent,
  Trophy,
  History,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
  PieChart,
  Pie,
  Legend,
} from 'recharts';

// ============================================================================
// Sub-components
// ============================================================================

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}

const MetricCard = ({ title, value, subtitle, icon, trend, trendValue }: MetricCardProps) => (
  <Card>
    <CardContent className="pt-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
        </div>
        <div className="flex flex-col items-end gap-1">
          <div className="p-2 bg-primary/10 rounded-full">{icon}</div>
          {trend && trendValue && (
            <div
              className={`flex items-center text-xs ${
                trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-500'
              }`}
            >
              {trend === 'up' ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
              {trendValue}
            </div>
          )}
        </div>
      </div>
    </CardContent>
  </Card>
);

// ============================================================================
// A/B Test Controls Component
// ============================================================================

const ABTestControls = () => {
  const { toast } = useToast();
  const { isRunning, analysis, config, start, stop, refresh, isSaving } = useABTest();
  const [trafficPercent, setTrafficPercent] = useState(50);

  const handleStart = () => {
    const testId = start(trafficPercent);
    toast({
      title: 'A/B Test Started',
      description: `Test ${testId} is now running with ${trafficPercent}% ML traffic.`,
    });
  };

  const handleStop = async () => {
    try {
      const result = await stop();
      toast({
        title: 'A/B Test Completed',
        description: `Winner: ${result.winner} (${(result.confidence * 100).toFixed(1)}% confidence)`,
      });
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to stop A/B test',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FlaskConical className="h-5 w-5" />
          A/B Test Controls
        </CardTitle>
        <CardDescription>Compare ML scoring vs rule-based scoring</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant={isRunning ? 'default' : 'secondary'}>
              {isRunning ? 'Running' : 'Stopped'}
            </Badge>
            {isRunning && config.testId && (
              <span className="text-xs text-muted-foreground">ID: {config.testId}</span>
            )}
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={refresh}>
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
            {isRunning ? (
              <Button variant="destructive" size="sm" onClick={handleStop} disabled={isSaving}>
                <Square className="h-4 w-4 mr-1" />
                Stop Test
              </Button>
            ) : (
              <Button size="sm" onClick={handleStart}>
                <Play className="h-4 w-4 mr-1" />
                Start Test
              </Button>
            )}
          </div>
        </div>

        {!isRunning && (
          <div className="space-y-2">
            <label className="text-sm font-medium">ML Traffic Percentage</label>
            <div className="flex items-center gap-4">
              <input
                type="range"
                min="10"
                max="90"
                value={trafficPercent}
                onChange={(e) => setTrafficPercent(Number(e.target.value))}
                className="flex-1"
              />
              <span className="text-sm font-mono w-12">{trafficPercent}%</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {trafficPercent}% ML / {100 - trafficPercent}% Rules
            </p>
          </div>
        )}

        {isRunning && analysis && (
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">ML Variant</p>
              <p className="text-lg font-bold">{analysis.mlResults.count} leads</p>
              <p className="text-sm text-green-600">
                {(analysis.mlResults.conversionRate * 100).toFixed(1)}% conversion
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-muted-foreground">Rules Variant</p>
              <p className="text-lg font-bold">{analysis.rulesResults.count} leads</p>
              <p className="text-sm text-blue-600">
                {(analysis.rulesResults.conversionRate * 100).toFixed(1)}% conversion
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Model Stats Component
// ============================================================================

const ModelStats = () => {
  const { toast } = useToast();
  const { stats, isLoading, isSaving, isRetraining, retrain, save, refresh, error } = useMLModel();

  const handleRetrain = async () => {
    try {
      const metrics = await retrain();
      toast({
        title: 'Model Retrained',
        description: `Accuracy: ${(metrics.accuracy * 100).toFixed(1)}%, AUC: ${(metrics.auc * 100).toFixed(1)}%`,
      });
    } catch (err: any) {
      toast({
        title: 'Retraining Failed',
        description: err.message || 'Need at least 10 training examples',
        variant: 'destructive',
      });
    }
  };

  const handleSave = async () => {
    try {
      await save();
      toast({
        title: 'Model Saved',
        description: 'Model weights saved to database',
      });
    } catch (err: any) {
      toast({
        title: 'Save Failed',
        description: err.message,
        variant: 'destructive',
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          Model Statistics
        </CardTitle>
        <CardDescription>Current ML model performance</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : stats ? (
          <>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Model Version</p>
                <p className="text-sm font-mono">{stats.version}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-muted-foreground">Training Examples</p>
                <p className="text-sm font-bold">{stats.trainingExamples}</p>
              </div>
            </div>

            {stats.lastUpdated && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Last updated: {new Date(stats.lastUpdated).toLocaleString()}
              </div>
            )}

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Top Feature Importance</p>
              <div className="space-y-2">
                {stats.featureImportance.slice(0, 5).map((f, i) => (
                  <div key={f.feature} className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground w-4">{i + 1}.</span>
                    <span className="text-xs flex-1 truncate">{f.feature.replace(/_/g, ' ')}</span>
                    <Progress value={f.importance * 100} className="w-20 h-2" />
                    <span className="text-xs font-mono w-12 text-right">
                      {(f.importance * 100).toFixed(1)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetrain}
                disabled={isRetraining || stats.trainingExamples < 10}
              >
                {isRetraining ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Zap className="h-4 w-4 mr-1" />
                )}
                Retrain
              </Button>
              <Button variant="outline" size="sm" onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save
              </Button>
              <Button variant="ghost" size="sm" onClick={refresh}>
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>

            {stats.trainingExamples < 10 && (
              <p className="text-xs text-amber-600 flex items-center gap-1">
                <AlertCircle className="h-3 w-3" />
                Need {10 - stats.trainingExamples} more examples to retrain
              </p>
            )}
          </>
        ) : (
          <p className="text-sm text-muted-foreground">No model data available</p>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// A/B Test Results Visualization
// ============================================================================

const ABTestVisualization = () => {
  const { analysis, history, isLoading } = useABTest();

  const comparisonData = useMemo(() => {
    if (!analysis) return [];
    return [
      {
        name: 'ML',
        conversions: analysis.mlResults.conversions,
        total: analysis.mlResults.count,
        rate: analysis.mlResults.conversionRate * 100,
      },
      {
        name: 'Rules',
        conversions: analysis.rulesResults.conversions,
        total: analysis.rulesResults.count,
        rate: analysis.rulesResults.conversionRate * 100,
      },
    ];
  }, [analysis]);

  const historyData = useMemo(() => {
    return (history || []).slice(0, 5).map((h) => ({
      date: new Date(h.created_at).toLocaleDateString(),
      mlRate: (h.analysis.mlResults.conversionRate * 100).toFixed(1),
      rulesRate: (h.analysis.rulesResults.conversionRate * 100).toFixed(1),
      winner: h.analysis.winner,
    }));
  }, [history]);

  const COLORS = ['#10b981', '#3b82f6'];

  return (
    <Card className="col-span-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          A/B Test Results
        </CardTitle>
        <CardDescription>Conversion rate comparison between variants</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : analysis && comparisonData.length > 0 ? (
          <div className="space-y-6">
            {/* Current Test Results */}
            <div className="grid grid-cols-3 gap-4">
              <div className="col-span-2">
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={comparisonData} layout="vertical">
                    <XAxis type="number" domain={[0, 100]} unit="%" />
                    <YAxis type="category" dataKey="name" width={60} />
                    <Tooltip
                      formatter={(value: number) => [`${value.toFixed(1)}%`, 'Conversion Rate']}
                    />
                    <Bar dataKey="rate" radius={[0, 4, 4, 0]}>
                      {comparisonData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-col justify-center space-y-4">
                <div className="text-center p-4 bg-muted rounded-lg">
                  <p className="text-xs text-muted-foreground mb-1">Winner</p>
                  <div className="flex items-center justify-center gap-2">
                    {analysis.winner === 'ml' && (
                      <Badge className="bg-green-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        ML
                      </Badge>
                    )}
                    {analysis.winner === 'rules' && (
                      <Badge className="bg-blue-500">
                        <Trophy className="h-3 w-3 mr-1" />
                        Rules
                      </Badge>
                    )}
                    {analysis.winner === 'inconclusive' && (
                      <Badge variant="secondary">Inconclusive</Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {(analysis.confidence * 100).toFixed(1)}% confidence
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-muted-foreground">Duration</p>
                  <p className="text-sm font-medium">{analysis.duration.toFixed(1)} days</p>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-4">
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">ML Leads</p>
                <p className="text-xl font-bold">{analysis.mlResults.count}</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.mlResults.conversions} converted
                </p>
              </div>
              <div className="p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                <p className="text-xs text-green-600 dark:text-green-400">ML Conv. Rate</p>
                <p className="text-xl font-bold">
                  {(analysis.mlResults.conversionRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg score: {analysis.mlResults.avgScore.toFixed(0)}
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">Rules Leads</p>
                <p className="text-xl font-bold">{analysis.rulesResults.count}</p>
                <p className="text-xs text-muted-foreground">
                  {analysis.rulesResults.conversions} converted
                </p>
              </div>
              <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                <p className="text-xs text-blue-600 dark:text-blue-400">Rules Conv. Rate</p>
                <p className="text-xl font-bold">
                  {(analysis.rulesResults.conversionRate * 100).toFixed(1)}%
                </p>
                <p className="text-xs text-muted-foreground">
                  Avg score: {analysis.rulesResults.avgScore.toFixed(0)}
                </p>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <FlaskConical className="h-12 w-12 mb-4 opacity-50" />
            <p>No A/B test data available</p>
            <p className="text-sm">Start a test to see results here</p>
          </div>
        )}

        {/* Historical Results */}
        {historyData.length > 0 && (
          <>
            <Separator className="my-6" />
            <div>
              <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                <History className="h-4 w-4" />
                Recent Test History
              </h4>
              <div className="space-y-2">
                {historyData.map((h, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-2 bg-muted/50 rounded"
                  >
                    <span className="text-sm">{h.date}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-sm text-green-600">ML: {h.mlRate}%</span>
                      <span className="text-sm text-blue-600">Rules: {h.rulesRate}%</span>
                      <Badge
                        variant={h.winner === 'ml' ? 'default' : h.winner === 'rules' ? 'secondary' : 'outline'}
                        className="w-20 justify-center"
                      >
                        {h.winner === 'ml' ? 'ML Won' : h.winner === 'rules' ? 'Rules Won' : 'Tie'}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

// ============================================================================
// Main Dashboard Component
// ============================================================================

export const MLLeadScoringDashboard = () => {
  const { getAllCachedScores, getModelStats } = useMLLeadScoring();
  const { analysis } = useABTest();
  const { stats } = useMLModel();

  const cachedScores = getAllCachedScores();

  // Calculate summary metrics
  const summaryMetrics = useMemo(() => {
    const scores = cachedScores;
    const mlScores = scores.filter((s) => s.variant === 'ml');
    const avgScore = scores.length > 0
      ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
      : 0;
    const hotLeads = scores.filter((s) => s.priority === 'hot').length;

    return {
      totalScored: scores.length,
      mlScored: mlScores.length,
      avgScore: avgScore.toFixed(0),
      hotLeads,
    };
  }, [cachedScores]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold flex items-center gap-2">
          <Brain className="h-6 w-6" />
          ML Lead Scoring
        </h2>
        <p className="text-muted-foreground">
          Machine learning-powered lead scoring with A/B testing
        </p>
      </div>

      {/* Summary Metrics */}
      <div className="grid grid-cols-4 gap-4">
        <MetricCard
          title="Total Scored"
          value={summaryMetrics.totalScored}
          subtitle="This session"
          icon={<Users className="h-5 w-5 text-primary" />}
        />
        <MetricCard
          title="ML Predictions"
          value={summaryMetrics.mlScored}
          subtitle={`${((summaryMetrics.mlScored / Math.max(summaryMetrics.totalScored, 1)) * 100).toFixed(0)}% of total`}
          icon={<Brain className="h-5 w-5 text-green-500" />}
        />
        <MetricCard
          title="Average Score"
          value={summaryMetrics.avgScore}
          subtitle="Out of 100"
          icon={<Target className="h-5 w-5 text-blue-500" />}
        />
        <MetricCard
          title="Hot Leads"
          value={summaryMetrics.hotLeads}
          subtitle="Score >= 70"
          icon={<Zap className="h-5 w-5 text-amber-500" />}
        />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="space-y-6">
          <ABTestControls />
          <ModelStats />
        </div>

        {/* Right Column - Visualization */}
        <ABTestVisualization />
      </div>

      {/* Training Progress */}
      {stats && stats.trainingExamples > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Training Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <Progress value={(stats.trainingExamples / 100) * 100} className="flex-1" />
              <span className="text-sm font-medium">{stats.trainingExamples} / 100 examples</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {stats.trainingExamples < 10
                ? `Need ${10 - stats.trainingExamples} more examples to enable retraining`
                : stats.trainingExamples < 100
                ? 'Model can be retrained. More examples will improve accuracy.'
                : 'Excellent! You have enough data for a well-trained model.'}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default MLLeadScoringDashboard;
