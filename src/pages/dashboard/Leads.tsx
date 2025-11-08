import { useState } from "react";
import { Download, Search, Filter, Mail, Phone, MessageSquare, Calendar, User, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuthStore } from "@/stores/useAuthStore";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { ZapierIntegrationModal } from "@/components/integrations/ZapierIntegrationModal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export default function Leads() {
  const [searchQuery, setSearchQuery] = useState("");
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showZapierModal, setShowZapierModal] = useState(false);
  const { user } = useAuthStore();
  const { toast } = useToast();
  const { subscription, hasFeature } = useSubscriptionLimits();

  const { data: leads, isLoading } = useQuery({
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

      {/* Search - Mobile optimized */}
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

      {/* Leads List - Mobile optimized */}
      <div className="space-y-2 sm:space-y-3">
        {isLoading ? (
          <Card>
            <CardContent className="p-6 sm:p-8 text-center text-muted-foreground text-sm sm:text-base">
              Loading leads...
            </CardContent>
          </Card>
        ) : filteredLeads && filteredLeads.length > 0 ? (
          filteredLeads.map((lead) => (
            <Card key={lead.id} className="hover:shadow-md active:shadow-lg transition-all">
              <CardContent className="p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 sm:gap-4">
                  <div className="flex items-start gap-3 sm:gap-4 flex-1 min-w-0">
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
    </div>
  );
}