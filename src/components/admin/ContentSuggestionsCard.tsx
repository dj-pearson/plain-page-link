import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { 
  Loader2, Lightbulb, Plus, Trash, CheckCircle, XCircle, 
  FileText, Hash, Clock, TrendingUp, Zap
} from "lucide-react";
import { useContentSuggestions } from "@/hooks/useContentSuggestions";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export function ContentSuggestionsCard() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [customInstructions, setCustomInstructions] = useState("");
  const [suggestionCount, setSuggestionCount] = useState("10");
  
  const {
    suggestions,
    isLoading,
    generateSuggestions,
    isGenerating,
    queueSuggestion,
    rejectSuggestion,
    deleteSuggestion,
    addToKeywords,
    writeArticle,
    isWritingArticle,
  } = useContentSuggestions();

  const handleGenerate = () => {
    generateSuggestions(customInstructions, parseInt(suggestionCount) || 10);
    setIsDialogOpen(false);
    setCustomInstructions("");
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'queued': return 'bg-blue-500';
      case 'in_progress': return 'bg-yellow-500';
      case 'completed': return 'bg-green-500';
      case 'rejected': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPriorityIcon = (priority: number | null) => {
    const p = priority || 3;
    if (p >= 4) return <TrendingUp className="h-3 w-3 text-red-500" />;
    if (p >= 3) return <TrendingUp className="h-3 w-3 text-orange-500" />;
    return <TrendingUp className="h-3 w-3 text-gray-500" />;
  };

  const pendingSuggestions = suggestions.filter(s => s.status === 'pending');
  const queuedSuggestions = suggestions.filter(s => s.status === 'queued');

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5" />
              AI Content Suggestions
            </CardTitle>
            <CardDescription>
              Generate high-value article ideas based on SEO keywords and market trends
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Generate Suggestions
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Generate Content Suggestions</DialogTitle>
                <DialogDescription>
                  AI will analyze your existing keywords and articles to suggest relevant topics
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Number of Suggestions</label>
                  <Input
                    type="number"
                    min="1"
                    max="50"
                    value={suggestionCount}
                    onChange={(e) => setSuggestionCount(e.target.value)}
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium">Custom Instructions (Optional)</label>
                  <Textarea
                    value={customInstructions}
                    onChange={(e) => setCustomInstructions(e.target.value)}
                    placeholder="E.g., Focus on first-time homebuyers in urban areas..."
                    rows={4}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleGenerate} disabled={isGenerating}>
                  {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Generate
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center p-8">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : suggestions.length > 0 ? (
          <div className="space-y-6">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Total</p>
                <p className="text-2xl font-bold">{suggestions.length}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Pending</p>
                <p className="text-2xl font-bold text-gray-600">{pendingSuggestions.length}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Queued</p>
                <p className="text-2xl font-bold text-blue-600">{queuedSuggestions.length}</p>
              </div>
              <div className="border rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-green-600">
                  {suggestions.filter(s => s.status === 'completed').length}
                </p>
              </div>
            </div>

            {/* Suggestions List */}
            <div className="space-y-3">
              {suggestions.map((suggestion) => (
                <div key={suggestion.id} className="border rounded-lg p-4 hover:border-primary transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getPriorityIcon(suggestion.priority)}
                        <h4 className="font-semibold">{suggestion.topic}</h4>
                        <Badge className={`${getStatusColor(suggestion.status)} text-white text-xs`}>
                          {suggestion.status || 'pending'}
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 mt-2">
                        <Badge variant="outline">{suggestion.category || 'General'}</Badge>
                        {suggestion.keywords?.slice(0, 3).map((keyword, idx) => (
                          <Badge key={idx} variant="secondary" className="gap-1">
                            <Hash className="h-3 w-3" />
                            {keyword}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex gap-2 ml-4">
                      {suggestion.status === 'pending' && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => writeArticle(suggestion)}
                            disabled={isWritingArticle}
                            title="Write Article Now"
                          >
                            {isWritingArticle ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Zap className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => queueSuggestion(suggestion.id)}
                            title="Add to Queue"
                          >
                            <Clock className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => addToKeywords(suggestion)}
                            title="Add to Keywords"
                          >
                            <Hash className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => rejectSuggestion(suggestion.id)}
                            title="Reject"
                          >
                            <XCircle className="h-4 w-4" />
                          </Button>
                        </>
                      )}
                      {suggestion.status === 'completed' && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled
                          title="Completed"
                        >
                          <CheckCircle className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => {
                          if (confirm('Delete this suggestion?')) {
                            deleteSuggestion(suggestion.id);
                          }
                        }}
                        title="Delete"
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-8">
            <Lightbulb className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">
              No content suggestions yet. Generate AI-powered topic ideas to get started.
            </p>
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Generate First Suggestions
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Generate Content Suggestions</DialogTitle>
                  <DialogDescription>
                    AI will analyze your existing keywords and articles to suggest relevant topics
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium">Number of Suggestions</label>
                    <Input
                      type="number"
                      min="1"
                      max="50"
                      value={suggestionCount}
                      onChange={(e) => setSuggestionCount(e.target.value)}
                      placeholder="10"
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium">Custom Instructions (Optional)</label>
                    <Textarea
                      value={customInstructions}
                      onChange={(e) => setCustomInstructions(e.target.value)}
                      placeholder="E.g., Focus on first-time homebuyers in urban areas..."
                      rows={4}
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleGenerate} disabled={isGenerating}>
                    {isGenerating && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                    Generate
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </CardContent>
    </Card>
  );
}