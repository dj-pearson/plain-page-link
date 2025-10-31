/**
 * Lead Management Dashboard Page
 * Integrated dashboard with all Sprint 5-6 features
 */

import { useState, useEffect } from "react";
import { LeadInbox } from "@/components/leads/LeadInbox";
import {
    ResponseTemplates,
    DEFAULT_TEMPLATES,
} from "@/components/leads/ResponseTemplates";
import {
    HotLeadAlert,
    HotLeadIndicator,
} from "@/components/leads/HotLeadAlert";
import { LeadDetailView } from "@/components/leads/LeadDetailView";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { analyzeLead } from "@/lib/lead-scoring";
import { Mail, MessageSquare, TrendingUp, Filter } from "lucide-react";

// Mock data (replace with actual API calls)
const mockLeads = [
    {
        id: "1",
        name: "Sarah Johnson",
        email: "sarah.j@email.com",
        phone: "+1 (555) 123-4567",
        message:
            "Hi, I'm very interested in the 3BR house in Downtown. I'd like to schedule a viewing this week if possible. I'm pre-approved and ready to move quickly. Can you provide more details about the HOA fees and recent renovations?",
        listingTitle: "Modern 3BR House in Downtown",
        listingId: "listing-1",
        source: "zillow",
        score: 85,
        status: "new" as const,
        priority: "hot" as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 15).toISOString(), // 15 min ago
        tags: ["pre-approved", "quick-move"],
    },
    {
        id: "2",
        name: "Michael Chen",
        email: "mchen@email.com",
        phone: "+1 (555) 987-6543",
        message:
            "Looking for properties in the $400-500k range. Interested in your luxury condo listing.",
        listingTitle: "Luxury Condo with Ocean View",
        listingId: "listing-2",
        source: "realtor",
        score: 72,
        status: "new" as const,
        priority: "hot" as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(), // 30 min ago
        tags: ["investor"],
    },
    {
        id: "3",
        name: "Emily Rodriguez",
        email: "emily.r@email.com",
        message: "What's the monthly HOA fee for the apartment near the park?",
        listingTitle: "Cozy 2BR Apartment Near Park",
        listingId: "listing-3",
        source: "facebook",
        score: 58,
        status: "contacted" as const,
        priority: "warm" as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), // 2 hours ago
        lastContactedAt: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
        tags: ["first-time-buyer"],
    },
    {
        id: "4",
        name: "David Kim",
        email: "dkim@email.com",
        phone: "+1 (555) 234-5678",
        message:
            "I saw your listing for the family home with pool. Is it still available?",
        listingTitle: "Spacious Family Home with Pool",
        listingId: "listing-4",
        source: "website",
        score: 45,
        status: "contacted" as const,
        priority: "warm" as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), // 5 hours ago
        lastContactedAt: new Date(
            Date.now() - 1000 * 60 * 60 * 3
        ).toISOString(),
    },
    {
        id: "5",
        name: "Lisa Anderson",
        email: "lisa.a@email.com",
        message: "Info please",
        listingTitle: "Renovated Townhouse in Suburbs",
        listingId: "listing-5",
        source: "instagram",
        score: 28,
        status: "new" as const,
        priority: "cold" as const,
        createdAt: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hours ago
    },
];

export default function LeadManagementDashboard() {
    const [leads, setLeads] = useState(mockLeads);
    const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
    const [selectedLead, setSelectedLead] = useState<
        (typeof mockLeads)[0] | null
    >(null);
    const [showHotLeads, setShowHotLeads] = useState(true);

    // Calculate hot leads (score >= 70)
    const hotLeads = leads.filter(
        (lead) => lead.score >= 70 && lead.status === "new"
    );

    // Calculate stats
    const stats = {
        total: leads.length,
        new: leads.filter((l) => l.status === "new").length,
        hot: hotLeads.length,
        contacted: leads.filter((l) => l.status === "contacted").length,
        avgScore: Math.round(
            leads.reduce((sum, l) => sum + l.score, 0) / leads.length
        ),
    };

    // Handlers
    const handleLeadClick = (lead: (typeof mockLeads)[0]) => {
        setSelectedLead(lead);
    };

    const handleCloseDetail = () => {
        setSelectedLead(null);
    };

    const handleQuickReply = (leadId: string) => {
        const lead = leads.find((l) => l.id === leadId);
        if (lead) {
            setSelectedLead(lead);
            toast.info("Opening quick reply for " + lead.name);
        }
    };

    const handleMarkAsRead = async (leadId: string) => {
        setLeads((prev) =>
            prev.map((lead) =>
                lead.id === leadId
                    ? { ...lead, status: "contacted" as const }
                    : lead
            )
        );
        toast.success("Lead marked as contacted");
    };

    const handleUpdateStatus = async (
        status: (typeof mockLeads)[0]["status"]
    ) => {
        if (!selectedLead) return;

        setLeads((prev) =>
            prev.map((lead) =>
                lead.id === selectedLead.id ? { ...lead, status } : lead
            )
        );
        setSelectedLead((prev) => (prev ? { ...prev, status } : null));
        toast.success(`Status updated to ${status}`);
    };

    const handleAddNote = async (note: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        // In real app, would update lead with new note
        console.log("Adding note:", note);
    };

    const handleSendEmail = async (subject: string, body: string) => {
        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 500));
        console.log("Sending email:", { subject, body });
        toast.success("Email sent!");
    };

    const handleDismissHotLead = (leadId: string) => {
        console.log("Dismissed hot lead:", leadId);
    };

    const handleViewHotLead = (leadId: string) => {
        const lead = leads.find((l) => l.id === leadId);
        if (lead) {
            handleLeadClick(lead);
        }
    };

    const handleSelectTemplate = (template: (typeof DEFAULT_TEMPLATES)[0]) => {
        if (!selectedLead) {
            toast.info("Please select a lead first");
            return;
        }

        // Replace variables in template
        let body = template.body;
        body = body.replace("{leadName}", selectedLead.name);
        body = body.replace(
            "{listingAddress}",
            selectedLead.listingTitle || "the property"
        );
        body = body.replace("{agentName}", "Your Name");
        body = body.replace("{agentPhone}", "(555) 123-4567");

        toast.success("Template loaded! Ready to send.");
        console.log("Using template:", { subject: template.subject, body });
    };

    const handleCreateTemplate = (
        template: Omit<(typeof DEFAULT_TEMPLATES)[0], "id">
    ) => {
        const newTemplate = {
            ...template,
            id: `custom-${Date.now()}`,
        };
        setTemplates((prev) => [...prev, newTemplate]);
    };

    const handleUpdateTemplate = (
        id: string,
        updates: Partial<(typeof DEFAULT_TEMPLATES)[0]>
    ) => {
        setTemplates((prev) =>
            prev.map((t) => (t.id === id ? { ...t, ...updates } : t))
        );
    };

    const handleDeleteTemplate = (id: string) => {
        setTemplates((prev) => prev.filter((t) => t.id !== id));
        toast.success("Template deleted");
    };

    return (
        <div className="container mx-auto py-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">Lead Management</h1>
                    <p className="text-gray-600 mt-1">
                        Manage your leads efficiently with smart scoring and
                        quick responses
                    </p>
                </div>
                <div className="flex gap-3">
                    <HotLeadIndicator
                        count={hotLeads.length}
                        onClick={() => setShowHotLeads(!showHotLeads)}
                    />
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <StatCard
                    label="Total Leads"
                    value={stats.total}
                    icon={<Mail className="w-5 h-5" />}
                />
                <StatCard
                    label="New"
                    value={stats.new}
                    icon={<MessageSquare className="w-5 h-5" />}
                    color="green"
                />
                <StatCard
                    label="Hot Leads"
                    value={stats.hot}
                    icon={<TrendingUp className="w-5 h-5" />}
                    color="red"
                    pulse={stats.hot > 0}
                />
                <StatCard
                    label="Contacted"
                    value={stats.contacted}
                    icon={<Mail className="w-5 h-5" />}
                    color="blue"
                />
                <StatCard
                    label="Avg Score"
                    value={stats.avgScore}
                    icon={<TrendingUp className="w-5 h-5" />}
                />
            </div>

            {/* Hot Lead Alerts */}
            {showHotLeads && hotLeads.length > 0 && (
                <HotLeadAlert
                    hotLeads={hotLeads}
                    onView={handleViewHotLead}
                    onDismiss={handleDismissHotLead}
                    soundEnabled={true}
                />
            )}

            {/* Main Content Tabs */}
            <Tabs defaultValue="inbox" className="w-full">
                <TabsList className="grid w-full grid-cols-2 max-w-md">
                    <TabsTrigger value="inbox">
                        Lead Inbox
                        {stats.new > 0 && (
                            <Badge
                                variant="outline"
                                className="ml-2 bg-green-100"
                            >
                                {stats.new}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="templates">
                        Response Templates
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="inbox" className="mt-6">
                    <LeadInbox
                        leads={leads}
                        onLeadClick={handleLeadClick}
                        onQuickReply={handleQuickReply}
                        onMarkAsRead={handleMarkAsRead}
                    />
                </TabsContent>

                <TabsContent value="templates" className="mt-6">
                    <ResponseTemplates
                        templates={templates}
                        onSelectTemplate={handleSelectTemplate}
                        onCreateTemplate={handleCreateTemplate}
                        onUpdateTemplate={handleUpdateTemplate}
                        onDeleteTemplate={handleDeleteTemplate}
                    />
                </TabsContent>
            </Tabs>

            {/* Lead Detail View */}
            {selectedLead && (
                <LeadDetailView
                    lead={selectedLead}
                    onClose={handleCloseDetail}
                    onUpdateStatus={handleUpdateStatus}
                    onAddNote={handleAddNote}
                    onSendEmail={handleSendEmail}
                />
            )}
        </div>
    );
}

// Stat Card Component
interface StatCardProps {
    label: string;
    value: number;
    icon: React.ReactNode;
    color?: "green" | "blue" | "red";
    pulse?: boolean;
}

function StatCard({ label, value, icon, color, pulse }: StatCardProps) {
    const colorClasses = {
        green: "bg-green-100 text-green-600",
        blue: "bg-blue-100 text-blue-600",
        red: "bg-red-100 text-red-600",
    };

    return (
        <div className="p-4 bg-white rounded-lg border hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
                <div
                    className={`p-2 rounded ${
                        color
                            ? colorClasses[color]
                            : "bg-gray-100 text-gray-600"
                    }`}
                >
                    {icon}
                </div>
                {pulse && (
                    <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                )}
            </div>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-sm text-gray-600">{label}</div>
        </div>
    );
}
