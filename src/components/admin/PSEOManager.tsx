import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Loader2,
  Eye,
  EyeOff,
  Trash,
  RotateCcw,
  Plus,
  Globe,
  AlertTriangle,
  CheckCircle,
  Clock,
  XCircle,
  BarChart3,
  ListPlus,
  Map,
  FileText,
  Layers,
} from "lucide-react";
import { format } from "date-fns";
import { usePSEO } from "@/hooks/usePSEO";
import {
  PSEO_PAGE_TYPES,
  PSEO_PAGE_TYPE_LABELS,
  PSEO_TAXONOMY_TYPES,
  type PSEOPageType,
  type PSEOPage,
  type PSEOQueueItem,
  type PSEOTaxonomyItem,
  type PSEOGenerationError,
  type PSEOTaxonomyType,
} from "@/types/pseo";

// --- Stats Overview Sub-Component ---

function StatsOverview() {
  const { stats, isLoadingStats } = usePSEO();

  if (isLoadingStats) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!stats) return null;

  const publishRate = stats.totalPages > 0
    ? Math.round((stats.publishedPages / stats.totalPages) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Top-level stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Globe className="h-4 w-4" />
              <span className="text-sm">Total Pages</span>
            </div>
            <p className="text-3xl font-bold">{stats.totalPages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Published</span>
            </div>
            <p className="text-3xl font-bold text-green-600">{stats.publishedPages}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="h-4 w-4 text-blue-500" />
              <span className="text-sm">Avg Quality</span>
            </div>
            <p className="text-3xl font-bold text-blue-600">{stats.avgQualityScore}/100</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertTriangle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Errors (24h)</span>
            </div>
            <p className="text-3xl font-bold text-red-600">{stats.recentErrors}</p>
          </CardContent>
        </Card>
      </div>

      {/* Publish rate progress */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">Publish Rate</span>
            <span className="text-sm text-muted-foreground">{publishRate}%</span>
          </div>
          <Progress value={publishRate} className="h-2" />
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{stats.publishedPages} published</span>
            <span>{stats.draftPages} drafts</span>
          </div>
        </CardContent>
      </Card>

      {/* Queue status */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Queue Pending</span>
            </div>
            <p className="text-2xl font-bold">{stats.queuePending}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Loader2 className="h-4 w-4" />
              <span className="text-sm">Processing</span>
            </div>
            <p className="text-2xl font-bold">{stats.queueProcessing}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <XCircle className="h-4 w-4 text-red-500" />
              <span className="text-sm">Failed</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{stats.queueFailed}</p>
          </CardContent>
        </Card>
      </div>

      {/* Pages by type */}
      {Object.keys(stats.pagesByType).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Pages by Type</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {Object.entries(stats.pagesByType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <span className="text-sm">
                    {PSEO_PAGE_TYPE_LABELS[type as PSEOPageType] || type}
                  </span>
                  <Badge variant="secondary">{count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Pages Tab Sub-Component ---

function PagesTab() {
  const {
    pages,
    isLoadingPages,
    publishPage,
    unpublishPage,
    deletePage,
    bulkPublish,
    bulkDelete,
  } = usePSEO();
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  if (isLoadingPages) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredPages = (pages ?? []).filter(page => {
    if (filterType !== "all" && page.page_type !== filterType) return false;
    if (filterStatus === "published" && !page.is_published) return false;
    if (filterStatus === "draft" && page.is_published) return false;
    if (searchQuery && !page.url_path.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const toggleSelect = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredPages.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredPages.map(p => p.id)));
    }
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search by URL path..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-64"
        />
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="All page types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Page Types</SelectItem>
            {PSEO_PAGE_TYPES.map(type => (
              <SelectItem key={type} value={type}>
                {PSEO_PAGE_TYPE_LABELS[type]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="published">Published</SelectItem>
            <SelectItem value="draft">Draft</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Bulk actions */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 p-3 bg-muted rounded-lg">
          <span className="text-sm font-medium">{selectedIds.size} selected</span>
          <Button
            size="sm"
            variant="outline"
            onClick={() => bulkPublish(Array.from(selectedIds))}
          >
            <CheckCircle className="h-4 w-4 mr-1" />
            Publish Selected
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (confirm(`Delete ${selectedIds.size} pages?`)) {
                bulkDelete(Array.from(selectedIds));
                setSelectedIds(new Set());
              }
            }}
          >
            <Trash className="h-4 w-4 mr-1" />
            Delete Selected
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setSelectedIds(new Set())}
          >
            Clear
          </Button>
        </div>
      )}

      {/* Pages table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-10">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === filteredPages.length && filteredPages.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded"
                  />
                </TableHead>
                <TableHead>URL Path</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Quality</TableHead>
                <TableHead>Agents</TableHead>
                <TableHead>Updated</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredPages.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12 text-muted-foreground">
                    No pages found. Add combinations to the queue to generate pages.
                  </TableCell>
                </TableRow>
              ) : (
                filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <input
                        type="checkbox"
                        checked={selectedIds.has(page.id)}
                        onChange={() => toggleSelect(page.id)}
                        className="rounded"
                      />
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[300px] truncate">
                      {page.url_path}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {PSEO_PAGE_TYPE_LABELS[page.page_type] || page.page_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={page.is_published ? "bg-green-500 text-white" : "bg-gray-500 text-white"}>
                        {page.is_published ? "Published" : "Draft"}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className={
                        page.quality_score >= 80 ? "text-green-600 font-semibold" :
                        page.quality_score >= 50 ? "text-yellow-600 font-semibold" :
                        "text-red-600 font-semibold"
                      }>
                        {page.quality_score}
                      </span>
                    </TableCell>
                    <TableCell>{page.agent_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(page.updated_at), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {page.is_published ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => unpublishPage(page.id)}
                            title="Unpublish"
                          >
                            <EyeOff className="h-4 w-4" />
                          </Button>
                        ) : (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => publishPage(page.id)}
                            title="Publish"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Delete this page?')) {
                              deletePage(page.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <p className="text-xs text-muted-foreground">
        Showing {filteredPages.length} of {pages?.length ?? 0} pages
      </p>
    </div>
  );
}

// --- Queue Tab Sub-Component ---

function QueueTab() {
  const {
    queue,
    isLoadingQueue,
    addToQueue,
    isAddingToQueue,
    retryQueueItem,
    deleteQueueItem,
  } = usePSEO();
  const [newPageType, setNewPageType] = useState<PSEOPageType>("city-directory");
  const [newCity, setNewCity] = useState("");
  const [newState, setNewState] = useState("");
  const [newSpecialty, setNewSpecialty] = useState("");
  const [newPriority, setNewPriority] = useState("5");

  if (isLoadingQueue) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleAddToQueue = () => {
    if (!newCity && !newState) {
      return;
    }

    const combination: Record<string, string> = {};
    if (newCity) combination.city = newCity.toLowerCase().replace(/\s+/g, '-');
    if (newState) combination.state = newState.toLowerCase().replace(/\s+/g, '-');
    if (newSpecialty) combination.specialty = newSpecialty.toLowerCase().replace(/\s+/g, '-');

    addToQueue([{
      page_type: newPageType,
      combination,
      priority: parseInt(newPriority, 10),
    }]);

    setNewCity("");
    setNewState("");
    setNewSpecialty("");
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'processing': return <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'complete': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
      case 'insufficient_data': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      default: return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-gray-500';
      case 'processing': return 'bg-blue-500';
      case 'complete': return 'bg-green-500';
      case 'failed': return 'bg-red-500';
      case 'insufficient_data': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const needsSpecialty = ['city-specialty'].includes(newPageType);
  const needsCity = !['state-directory'].includes(newPageType);

  return (
    <div className="space-y-6">
      {/* Add to queue form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Add to Generation Queue</CardTitle>
          <CardDescription>
            Queue new page combinations for content generation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div>
              <Label>Page Type</Label>
              <Select value={newPageType} onValueChange={(v) => setNewPageType(v as PSEOPageType)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PSEO_PAGE_TYPES.map(type => (
                    <SelectItem key={type} value={type}>
                      {PSEO_PAGE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>State</Label>
              <Input
                placeholder="e.g., Texas"
                value={newState}
                onChange={(e) => setNewState(e.target.value)}
              />
            </div>
            {needsCity && (
              <div>
                <Label>City</Label>
                <Input
                  placeholder="e.g., Austin"
                  value={newCity}
                  onChange={(e) => setNewCity(e.target.value)}
                />
              </div>
            )}
            {needsSpecialty && (
              <div>
                <Label>Specialty</Label>
                <Input
                  placeholder="e.g., luxury"
                  value={newSpecialty}
                  onChange={(e) => setNewSpecialty(e.target.value)}
                />
              </div>
            )}
            <div>
              <Label>Priority (1-10)</Label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min={1}
                  max={10}
                  value={newPriority}
                  onChange={(e) => setNewPriority(e.target.value)}
                />
                <Button onClick={handleAddToQueue} disabled={isAddingToQueue}>
                  {isAddingToQueue ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Queue table */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Generation Queue</CardTitle>
          <CardDescription>
            {queue?.length ?? 0} items in queue
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Status</TableHead>
                <TableHead>Page Type</TableHead>
                <TableHead>Combination</TableHead>
                <TableHead>Priority</TableHead>
                <TableHead>Attempts</TableHead>
                <TableHead>Queued</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {(queue ?? []).length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    Queue is empty. Add combinations above to start generating pages.
                  </TableCell>
                </TableRow>
              ) : (
                (queue ?? []).map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        {getStatusIcon(item.status)}
                        <Badge className={`${getStatusColor(item.status)} text-white text-xs`}>
                          {item.status}
                        </Badge>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm">
                      {PSEO_PAGE_TYPE_LABELS[item.page_type as PSEOPageType] || item.page_type}
                    </TableCell>
                    <TableCell className="font-mono text-xs max-w-[200px] truncate">
                      {Object.entries(item.combination).map(([k, v]) => `${k}=${v}`).join(', ')}
                    </TableCell>
                    <TableCell>{item.priority}</TableCell>
                    <TableCell>{item.attempt_count}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(item.queued_at), 'MMM d, HH:mm')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        {(item.status === 'failed' || item.status === 'insufficient_data') && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => retryQueueItem(item.id)}
                            title="Retry"
                          >
                            <RotateCcw className="h-4 w-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm('Remove from queue?')) {
                              deleteQueueItem(item.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Error details for failed items */}
      {(queue ?? []).filter(q => q.status === 'failed' && q.error_message).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg text-red-600">Failed Items</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {(queue ?? [])
              .filter(q => q.status === 'failed' && q.error_message)
              .map((item) => (
                <div key={item.id} className="border rounded-lg p-3 border-red-200 bg-red-50">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-xs">
                      {Object.values(item.combination).join(' / ')}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {item.attempt_count} attempts
                    </Badge>
                  </div>
                  <p className="text-sm text-red-700">{item.error_message}</p>
                </div>
              ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// --- Taxonomy Tab Sub-Component ---

function TaxonomyTab() {
  const {
    taxonomy,
    isLoadingTaxonomy,
    createTaxonomy,
    updateTaxonomy,
    deleteTaxonomy,
  } = usePSEO();
  const [filterTaxType, setFilterTaxType] = useState<string>("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [newId, setNewId] = useState("");
  const [newDisplayName, setNewDisplayName] = useState("");
  const [newTaxType, setNewTaxType] = useState<PSEOTaxonomyType>("city");
  const [newParentId, setNewParentId] = useState("");
  const [newTier, setNewTier] = useState("3");
  const [newContext, setNewContext] = useState("{}");

  if (isLoadingTaxonomy) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const filteredTaxonomy = (taxonomy ?? []).filter(item => {
    if (filterTaxType !== "all" && item.taxonomy_type !== filterTaxType) return false;
    return true;
  });

  const handleCreate = () => {
    if (!newId || !newDisplayName) return;

    let context: Record<string, unknown>;
    try {
      context = JSON.parse(newContext);
    } catch {
      context = {};
    }

    createTaxonomy({
      id: newId,
      taxonomy_type: newTaxType,
      display_name: newDisplayName,
      parent_id: newParentId || null,
      context,
      is_active: true,
      tier: parseInt(newTier, 10),
    });

    setNewId("");
    setNewDisplayName("");
    setNewContext("{}");
    setNewParentId("");
    setShowAddForm(false);
  };

  const taxonomyTypeLabels: Record<string, string> = {
    city: 'City',
    state: 'State',
    neighborhood: 'Neighborhood',
    specialty: 'Specialty',
    situation: 'Life Situation',
    property_type: 'Property Type',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-3">
          <Select value={filterTaxType} onValueChange={setFilterTaxType}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="All types" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {PSEO_TAXONOMY_TYPES.map(type => (
                <SelectItem key={type} value={type}>
                  {taxonomyTypeLabels[type] || type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)} variant={showAddForm ? "secondary" : "default"}>
          <Plus className="h-4 w-4 mr-2" />
          {showAddForm ? "Cancel" : "Add Taxonomy Item"}
        </Button>
      </div>

      {/* Add form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Add Taxonomy Item</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label>ID (slug)</Label>
                <Input
                  placeholder="e.g., austin-tx"
                  value={newId}
                  onChange={(e) => setNewId(e.target.value)}
                />
              </div>
              <div>
                <Label>Display Name</Label>
                <Input
                  placeholder="e.g., Austin"
                  value={newDisplayName}
                  onChange={(e) => setNewDisplayName(e.target.value)}
                />
              </div>
              <div>
                <Label>Type</Label>
                <Select value={newTaxType} onValueChange={(v) => setNewTaxType(v as PSEOTaxonomyType)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PSEO_TAXONOMY_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {taxonomyTypeLabels[type] || type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Parent ID (optional)</Label>
                <Input
                  placeholder="e.g., texas"
                  value={newParentId}
                  onChange={(e) => setNewParentId(e.target.value)}
                />
              </div>
              <div>
                <Label>Tier (1-3)</Label>
                <Input
                  type="number"
                  min={1}
                  max={3}
                  value={newTier}
                  onChange={(e) => setNewTier(e.target.value)}
                />
              </div>
              <div className="flex items-end">
                <Button onClick={handleCreate} className="w-full">
                  Create
                </Button>
              </div>
            </div>
            <div className="mt-4">
              <Label>Context (JSON)</Label>
              <Textarea
                placeholder='{"market_character": "tech-driven", "median_home_price": 540000}'
                value={newContext}
                onChange={(e) => setNewContext(e.target.value)}
                rows={4}
                className="font-mono text-xs"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Taxonomy counts */}
      <div className="grid grid-cols-3 md:grid-cols-6 gap-3">
        {PSEO_TAXONOMY_TYPES.map(type => {
          const count = (taxonomy ?? []).filter(t => t.taxonomy_type === type).length;
          return (
            <Card key={type} className="cursor-pointer hover:border-primary transition-colors"
              onClick={() => setFilterTaxType(type)}>
              <CardContent className="pt-4 pb-4 text-center">
                <p className="text-2xl font-bold">{count}</p>
                <p className="text-xs text-muted-foreground">{taxonomyTypeLabels[type]}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Taxonomy table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Display Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Parent</TableHead>
                <TableHead>Tier</TableHead>
                <TableHead>Active</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTaxonomy.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-12 text-muted-foreground">
                    No taxonomy items found. Add cities, states, and specialties to get started.
                  </TableCell>
                </TableRow>
              ) : (
                filteredTaxonomy.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-mono text-xs">{item.id}</TableCell>
                    <TableCell className="font-medium">{item.display_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">
                        {taxonomyTypeLabels[item.taxonomy_type] || item.taxonomy_type}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-xs text-muted-foreground">
                      {item.parent_id || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={item.tier === 1 ? "default" : "secondary"} className="text-xs">
                        Tier {item.tier}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {item.is_active ? (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      ) : (
                        <XCircle className="h-4 w-4 text-red-500" />
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            updateTaxonomy({
                              id: item.id,
                              updates: { is_active: !item.is_active },
                            });
                          }}
                          title={item.is_active ? "Deactivate" : "Activate"}
                        >
                          {item.is_active ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            if (confirm(`Delete taxonomy item "${item.display_name}"?`)) {
                              deleteTaxonomy(item.id);
                            }
                          }}
                          title="Delete"
                        >
                          <Trash className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

// --- Errors Tab Sub-Component ---

function ErrorsTab() {
  const { errors, isLoadingErrors } = usePSEO();

  if (isLoadingErrors) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const errorTypeColors: Record<string, string> = {
    api_error: 'bg-red-500',
    validation_failed: 'bg-orange-500',
    quality_check_failed: 'bg-yellow-500',
    timeout: 'bg-purple-500',
    parse_error: 'bg-blue-500',
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Showing last 100 generation errors
      </p>

      {(errors ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No generation errors recorded.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {(errors ?? []).map((error) => (
            <Card key={error.id}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Badge className={`${errorTypeColors[error.error_type] || 'bg-gray-500'} text-white text-xs`}>
                      {error.error_type.replace(/_/g, ' ')}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      {PSEO_PAGE_TYPE_LABELS[error.page_type as PSEOPageType] || error.page_type}
                    </Badge>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {format(new Date(error.created_at), 'MMM d, yyyy HH:mm')}
                  </span>
                </div>
                <p className="font-mono text-xs text-muted-foreground mb-2">
                  {Object.entries(error.combination).map(([k, v]) => `${k}=${v}`).join(', ')}
                </p>
                {error.error_detail && (
                  <p className="text-sm text-red-700 bg-red-50 rounded p-2">
                    {error.error_detail}
                  </p>
                )}
                {error.quality_check_failures && (
                  <div className="mt-2">
                    <p className="text-xs font-medium mb-1">Quality Check Failures:</p>
                    <pre className="text-xs bg-muted rounded p-2 overflow-x-auto">
                      {JSON.stringify(error.quality_check_failures, null, 2)}
                    </pre>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// --- Prompts Tab Sub-Component ---

function PromptsTab() {
  const { prompts, isLoadingPrompts, updatePrompt, createPrompt } = usePSEO();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editSystemPrompt, setEditSystemPrompt] = useState("");
  const [editUserPrompt, setEditUserPrompt] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newPromptPageType, setNewPromptPageType] = useState<PSEOPageType>("city-directory");
  const [newSystemPrompt, setNewSystemPrompt] = useState("");
  const [newUserPrompt, setNewUserPrompt] = useState("");

  if (isLoadingPrompts) {
    return (
      <div className="flex items-center justify-center p-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleStartEdit = (prompt: { id: string; system_prompt: string; user_prompt_template: string }) => {
    setEditingId(prompt.id);
    setEditSystemPrompt(prompt.system_prompt);
    setEditUserPrompt(prompt.user_prompt_template);
  };

  const handleSaveEdit = (prompt: { id: string; version: number }) => {
    updatePrompt({
      id: prompt.id,
      updates: {
        system_prompt: editSystemPrompt,
        user_prompt_template: editUserPrompt,
        version: prompt.version + 1,
      },
    });
    setEditingId(null);
  };

  const handleCreatePrompt = () => {
    if (!newSystemPrompt || !newUserPrompt) return;
    createPrompt({
      page_type: newPromptPageType,
      system_prompt: newSystemPrompt,
      user_prompt_template: newUserPrompt,
    });
    setNewSystemPrompt("");
    setNewUserPrompt("");
    setShowCreateForm(false);
  };

  const existingPageTypes = new Set((prompts ?? []).map(p => p.page_type));
  const availablePageTypes = PSEO_PAGE_TYPES.filter(t => !existingPageTypes.has(t));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Manage generation prompts for each page type. Prompt updates take effect on next generation.
          </p>
        </div>
        {availablePageTypes.length > 0 && (
          <Button onClick={() => setShowCreateForm(!showCreateForm)} variant={showCreateForm ? "secondary" : "default"}>
            <Plus className="h-4 w-4 mr-2" />
            {showCreateForm ? "Cancel" : "Add Prompt"}
          </Button>
        )}
      </div>

      {/* Create form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Create Prompt Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Page Type</Label>
              <Select value={newPromptPageType} onValueChange={(v) => setNewPromptPageType(v as PSEOPageType)}>
                <SelectTrigger className="w-64">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {availablePageTypes.map(type => (
                    <SelectItem key={type} value={type}>
                      {PSEO_PAGE_TYPE_LABELS[type]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>System Prompt</Label>
              <Textarea
                value={newSystemPrompt}
                onChange={(e) => setNewSystemPrompt(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                placeholder="You are an expert real estate content writer..."
              />
            </div>
            <div>
              <Label>User Prompt Template</Label>
              <Textarea
                value={newUserPrompt}
                onChange={(e) => setNewUserPrompt(e.target.value)}
                rows={6}
                className="font-mono text-xs"
                placeholder="Generate a city directory page for {{city}}, {{state}}..."
              />
            </div>
            <Button onClick={handleCreatePrompt}>Create Prompt</Button>
          </CardContent>
        </Card>
      )}

      {/* Existing prompts */}
      {(prompts ?? []).length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            No prompt templates configured yet. Add prompts for each page type.
          </CardContent>
        </Card>
      ) : (
        (prompts ?? []).map((prompt) => (
          <Card key={prompt.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CardTitle className="text-lg">
                    {PSEO_PAGE_TYPE_LABELS[prompt.page_type as PSEOPageType] || prompt.page_type}
                  </CardTitle>
                  <Badge variant="outline">v{prompt.version}</Badge>
                  <Badge variant={prompt.is_active ? "default" : "secondary"}>
                    {prompt.is_active ? "Active" : "Inactive"}
                  </Badge>
                </div>
                {editingId === prompt.id ? (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleSaveEdit(prompt)}>Save</Button>
                    <Button size="sm" variant="ghost" onClick={() => setEditingId(null)}>Cancel</Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => handleStartEdit(prompt)}>
                    Edit
                  </Button>
                )}
              </div>
              <CardDescription>
                Last updated: {format(new Date(prompt.updated_at), 'MMM d, yyyy HH:mm')}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">System Prompt</Label>
                {editingId === prompt.id ? (
                  <Textarea
                    value={editSystemPrompt}
                    onChange={(e) => setEditSystemPrompt(e.target.value)}
                    rows={6}
                    className="font-mono text-xs mt-1"
                  />
                ) : (
                  <pre className="text-xs bg-muted rounded p-3 mt-1 overflow-x-auto whitespace-pre-wrap max-h-40">
                    {prompt.system_prompt}
                  </pre>
                )}
              </div>
              <div>
                <Label className="text-xs font-semibold uppercase text-muted-foreground">User Prompt Template</Label>
                {editingId === prompt.id ? (
                  <Textarea
                    value={editUserPrompt}
                    onChange={(e) => setEditUserPrompt(e.target.value)}
                    rows={6}
                    className="font-mono text-xs mt-1"
                  />
                ) : (
                  <pre className="text-xs bg-muted rounded p-3 mt-1 overflow-x-auto whitespace-pre-wrap max-h-40">
                    {prompt.user_prompt_template}
                  </pre>
                )}
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}

// --- Main PSEOManager Component ---

export function PSEOManager() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Programmatic SEO Manager</CardTitle>
          <CardDescription>
            Generate and manage thousands of SEO-optimized agent discovery pages across US markets.
            Target: ~9,550 pages at full build-out.
          </CardDescription>
        </CardHeader>
      </Card>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-5 lg:w-auto">
          <TabsTrigger value="overview" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="pages" className="gap-2">
            <Globe className="h-4 w-4" />
            Pages
          </TabsTrigger>
          <TabsTrigger value="queue" className="gap-2">
            <ListPlus className="h-4 w-4" />
            Queue
          </TabsTrigger>
          <TabsTrigger value="taxonomy" className="gap-2">
            <Map className="h-4 w-4" />
            Taxonomy
          </TabsTrigger>
          <TabsTrigger value="prompts" className="gap-2">
            <FileText className="h-4 w-4" />
            Prompts
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <StatsOverview />
        </TabsContent>

        <TabsContent value="pages">
          <PagesTab />
        </TabsContent>

        <TabsContent value="queue">
          <QueueTab />
        </TabsContent>

        <TabsContent value="taxonomy">
          <TaxonomyTab />
        </TabsContent>

        <TabsContent value="prompts">
          <PromptsTab />
        </TabsContent>
      </Tabs>

      {/* Errors section always visible at bottom */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <CardTitle>Generation Errors</CardTitle>
          </div>
          <CardDescription>
            Recent errors from the content generation pipeline
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ErrorsTab />
        </CardContent>
      </Card>
    </div>
  );
}
