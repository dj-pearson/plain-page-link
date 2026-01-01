import { useState } from "react";
import { Download, Search, Filter, Mail, Phone, MessageSquare, Calendar, User, Zap, CheckSquare, Square, Trash2, CheckCircle2, AlertCircle, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ZapierIntegrationModal } from "@/components/integrations/ZapierIntegrationModal";
import { LeadDetailModal } from "@/components/leads/LeadDetailModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { SkeletonLeads } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Lead } from "@/types/lead";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [showLeadDetail, setShowLeadDetail] = useState(false);
  const [selectedLeadIds, setSelectedLeadIds] = useState<Set<string>>(new Set());
  const [isBulkActing, setIsBulkActing] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { subscription, hasFeature } = useSubscriptionLimits();

  const { data: leads, isLoading, isError, error, refetch } = useQuery({
    queryKey: ["leads", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("leads")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });

  const handleLeadClick = (lead: Lead) => {
    setSelectedLead(lead);
    setShowLeadDetail(true);
  };

  // Bulk selection handlers
  const toggleLeadSelection = (leadId: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent opening the detail modal
    setSelectedLeadIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(leadId)) {
        newSet.delete(leadId);
      } else {
        newSet.add(leadId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedLeadIds.size === filteredLeads?.length) {
      setSelectedLeadIds(new Set());
    } else {
      setSelectedLeadIds(new Set(filteredLeads?.map(l => l.id) || []));
    }
  };

  const handleBulkStatusUpdate = async (newStatus: string) => {
    if (selectedLeadIds.size === 0) return;

    setIsBulkActing(true);
    try {
      const { error } = await supabase
        .from("leads")
        .update({ status: newStatus })
        .in("id", Array.from(selectedLeadIds));

      if (error) throw error;

      toast({
        title: "Status updated",
        description: `Updated ${selectedLeadIds.size} lead(s) to ${newStatus}`,
      });

      setSelectedLeadIds(new Set());
      refetch();
    } catch (error) {
      console.error("Bulk status update failed:", error);
      toast({
        title: "Error",
        description: "Failed to update lead status",
        variant: "destructive",
      });
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedLeadIds.size === 0) return;

    if (!confirm(`Are you sure you want to delete ${selectedLeadIds.size} lead(s)? This action cannot be undone.`)) {
      return;
    }

    setIsBulkActing(true);
    try {
      const { error } = await supabase
        .from("leads")
        .delete()
        .in("id", Array.from(selectedLeadIds));

      if (error) throw error;

      toast({
        title: "Leads deleted",
        description: `Deleted ${selectedLeadIds.size} lead(s)`,
      });

      setSelectedLeadIds(new Set());
      refetch();
    } catch (error) {
      console.error("Bulk delete failed:", error);
      toast({
        title: "Error",
        description: "Failed to delete leads",
        variant: "destructive",
      });
    } finally {
      setIsBulkActing(false);
    }
  };

  const handleExportLeads = () => {
    // Check if user has export feature
    if (subscription?.plan_name === 'free') {
      setShowUpgradeModal(true);
      return;
    }

    if (!leads || leads.length === 0) {
      toast({
        title: "No leads to export",
        description: "You don't have any leads yet.",
        variant: "destructive",
      });
      return;
    }

    // Create CSV
    const headers = ["Name", "Email", "Phone", "Type", "Message", "Status", "Created At"];
    const csvContent = [
      headers.join(","),
      ...leads.map((lead) =>
        [
          lead.name,
          lead.email,
          lead.phone || "",
          lead.lead_type,
          `"${(lead.message || "").replace(/"/g, '""')}"`,
          lead.status,
          new Date(lead.created_at).toLocaleDateString(),
        ].join(",")
      ),
    ].join("\n");

    // Download
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leads-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast({
      title: "Leads exported",
      description: `Successfully exported ${leads.length} leads to CSV`,
    });
  };

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { variant: "default" | "secondary" | "destructive" | "outline"; label: string }> = {
      new: { variant: "default", label: "New" },
      contacted: { variant: "secondary", label: "Contacted" },
      qualified: { variant: "outline", label: "Qualified" },
      converted: { variant: "default", label: "Converted" },
    };
    const config = statusMap[status] || { variant: "outline", label: status };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getLeadTypeIcon = (type: string) => {
    switch (type) {
      case "buyer":
        return <User className="h-4 w-4" />;
      case "seller":
        return <Phone className="h-4 w-4" />;
      case "valuation":
        return <Mail className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const filteredLeads = leads?.filter((lead) =>
    searchQuery
      ? lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchQuery.toLowerCase())
      : true
  );

  return (
    <div className="space-y-4 sm:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Lead Management</h1>
          <p className="text-sm sm:text-base text-muted-foreground mt-0.5 sm:mt-1">
            Track and follow up with your inquiries
          </p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            onClick={() => setShowZapierModal(true)}
            variant="outline"
            className="flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all"
          >
            <Zap className="h-4 w-4 mr-2 text-orange-500" />
            <span className="text-sm sm:text-base">Zapier</span>
          </Button>
          <Button
            onClick={handleExportLeads}
            variant="outline"
            disabled={!leads || leads.length === 0}
            className="flex-1 sm:flex-none min-h-[44px] active:scale-95 transition-all"
          >
            <Download className="h-4 w-4 mr-2" />
            <span className="text-sm sm:text-base">Export CSV</span>
            {subscription?.plan_name === 'free' && (
              <Badge variant="secondary" className="ml-2">Pro</Badge>
            )}
          </Button>
        </div>
      </div>

      {/* Stats - Mobile optimized 2x2 grid */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-foreground">{leads?.length || 0}</div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Total Leads</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-green-600">
              {leads?.filter((l) => l.status === "new").length || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">New</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-blue-600">
              {leads?.filter((l) => l.status === "contacted").length || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Contacted</div>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardContent className="pt-4 sm:pt-6 pb-4 sm:pb-6">
            <div className="text-xl sm:text-2xl font-bold text-primary">
              {leads?.filter((l) => l.status === "converted").length || 0}
            </div>
            <div className="text-xs sm:text-sm text-muted-foreground mt-0.5">Converted</div>
          </CardContent>
        </Card>
      </div>

      {/* Search & Bulk Actions - Mobile optimized */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            placeholder="Search leads by name or email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm sm:text-base min-h-[44px]"
          />
        </div>

        {/* Bulk Actions Toolbar */}
        {selectedLeadIds.size > 0 && (
          <Card className="bg-blue-50 border-blue-200">
            <CardContent className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-5 w-5 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    {selectedLeadIds.size} lead{selectedLeadIds.size !== 1 ? 's' : ''} selected
                  </span>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  <Select onValueChange={handleBulkStatusUpdate} disabled={isBulkActing}>
                    <SelectTrigger className="w-[140px] sm:w-[160px] h-9 bg-white">
                      <SelectValue placeholder="Update status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="contacted">Contacted</SelectItem>
                      <SelectItem value="qualified">Qualified</SelectItem>
                      <SelectItem value="converted">Converted</SelectItem>
                      <SelectItem value="lost">Lost</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleBulkDelete}
                    disabled={isBulkActing}
                    className="gap-2"
                  >
                    <Trash2 className="h-4 w-4" />
                    Delete
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedLeadIds(new Set())}
                    disabled={isBulkActing}
                  >
                    Clear
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Leads List Header with Select All */}
      {filteredLeads && filteredLeads.length > 0 && (
        <div className="flex items-center gap-2 px-2">
          <button
            onClick={toggleSelectAll}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[44px] px-2"
          >
            {selectedLeadIds.size === filteredLeads.length ? (
              <CheckSquare className="h-5 w-5 text-primary" />
            ) : (
              <Square className="h-5 w-5" />
            )}
            <span>Select all</span>
          </button>
        </div>
      )}

      {/* Leads List - Mobile optimized */}
      <div className="space-y-2 sm:space-y-3">
        {isError ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-red-100 rounded-full mb-3 sm:mb-4">
                <AlertCircle className="h-7 w-7 sm:h-8 sm:w-8 text-red-600" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                Failed to load leads
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground mb-4 max-w-sm mx-auto">
                {error instanceof Error ? error.message : "An unexpected error occurred. Please try again."}
              </p>
              <Button onClick={() => refetch()} variant="outline" className="gap-2">
                <RefreshCw className="h-4 w-4" />
                Try Again
              </Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="space-y-2 sm:space-y-3" role="status" aria-label="Loading leads">
            {Array.from({ length: 4 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start gap-4 animate-pulse">
                    <div className="h-10 w-10 rounded-full bg-gray-200 flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2">
                        <div className="h-5 w-32 bg-gray-200 rounded" />
                        <div className="h-5 w-16 bg-gray-200 rounded-full" />
                      </div>
                      <div className="h-4 w-48 bg-gray-200 rounded" />
                      <div className="h-4 w-36 bg-gray-200 rounded" />
                    </div>
                    <div className="h-4 w-20 bg-gray-200 rounded" />
                  </div>
                </CardContent>
              </Card>
            ))}
            <span className="sr-only">Loading leads...</span>
          </div>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card
              key={lead.id}
              className="hover:shadow-md active:shadow-lg transition-all cursor-pointer"
              onClick={() => handleLeadClick(lead)}
            >
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
                    {/* Checkbox */}
                    <button
                      onClick={(e) => toggleLeadSelection(lead.id, e)}
                      className="flex-shrink-0 mt-1 hover:bg-gray-100 rounded p-1 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                    >
                      {selectedLeadIds.has(lead.id) ? (
                        <CheckSquare className="h-5 w-5 text-primary" />
                      ) : (
                        <Square className="h-5 w-5 text-gray-400" />
                      )}
                    </button>

                    {/* Icon */}
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {getLeadTypeIcon(lead.lead_type)}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <h3 className="font-semibold text-sm sm:text-base text-foreground truncate">{lead.name}</h3>
                        {getStatusBadge(lead.status)}
                        <Badge variant="outline" className="capitalize text-xs">
                          {lead.lead_type}
                        </Badge>
                      </div>

                      <div className="space-y-1.5 text-xs sm:text-sm text-muted-foreground">
                        <div className="flex items-center gap-2 min-h-[32px]">
                          <Mail className="h-3 w-3 flex-shrink-0" />
                          <a href={`mailto:${lead.email}`} className="hover:text-primary active:text-primary-dark break-all">
                            {lead.email}
                          </a>
                        </div>
                        {lead.phone && (
                          <div className="flex items-center gap-2 min-h-[32px]">
                            <Phone className="h-3 w-3 flex-shrink-0" />
                            <a href={`tel:${lead.phone}`} className="hover:text-primary active:text-primary-dark">
                              {lead.phone}
                            </a>
                          </div>
                        )}
                        {lead.message && (
                          <p className="mt-2 text-foreground line-clamp-2 text-xs sm:text-sm leading-relaxed">{lead.message}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Date - Mobile: below content, Desktop: right side */}
                  <div className="text-left sm:text-right flex-shrink-0 pl-12 sm:pl-0">
                    <div className="flex sm:justify-end items-center gap-1 text-xs text-muted-foreground">
                      <Calendar className="h-3 w-3" />
                      <span>{new Date(lead.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className="p-8 sm:p-12 text-center">
              <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 bg-accent rounded-full mb-3 sm:mb-4">
                <MessageSquare className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-foreground mb-1 sm:mb-2">
                No leads yet
              </h3>
              <p className="text-sm sm:text-base text-muted-foreground max-w-sm mx-auto">
                Leads will appear here when visitors contact you through your profile
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="lead_export"
        currentPlan={subscription?.plan_name || "Free"}
        requiredPlan="Starter"
      />

      {/* Zapier Integration Modal */}
      <ZapierIntegrationModal
        open={showZapierModal}
        onOpenChange={setShowZapierModal}
      />

      {/* Lead Detail Modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          open={showLeadDetail}
          onOpenChange={setShowLeadDetail}
          onLeadUpdated={() => refetch()}
        />
      )}
    </div>
  );
}