/**
 * Advanced Lead Inbox Component
 * Displays leads with filtering, search, and quick actions
 */

import { useState, useMemo } from "react";
import {
    Search,
    Filter,
    Star,
    Mail,
    Phone,
    Clock,
    ChevronDown,
    MessageSquare,
    TrendingUp,
    MapPin,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    listingTitle?: string;
    listingId?: string;
    source: string;
    score: number; // 0-100
    status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
    priority: "hot" | "warm" | "cold";
    createdAt: string;
    lastContactedAt?: string;
    tags?: string[];
}

interface LeadInboxProps {
    leads: Lead[];
    onLeadClick: (lead: Lead) => void;
    onQuickReply: (leadId: string) => void;
    onMarkAsRead: (leadId: string) => void;
    className?: string;
}

export function LeadInbox({
    leads,
    onLeadClick,
    onQuickReply,
    onMarkAsRead,
    className,
}: LeadInboxProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [sourceFilter, setSourceFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<"date" | "score" | "priority">("date");

    // Filter and sort leads
    const filteredLeads = useMemo(() => {
        let filtered = leads.filter((lead) => {
            // Search filter
            const matchesSearch =
                searchQuery === "" ||
                lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
                lead.message.toLowerCase().includes(searchQuery.toLowerCase());

            // Status filter
            const matchesStatus =
                statusFilter === "all" || lead.status === statusFilter;

            // Priority filter
            const matchesPriority =
                priorityFilter === "all" || lead.priority === priorityFilter;

            // Source filter
            const matchesSource =
                sourceFilter === "all" || lead.source === sourceFilter;

            return (
                matchesSearch &&
                matchesStatus &&
                matchesPriority &&
                matchesSource
            );
        });

        // Sort
        filtered.sort((a, b) => {
            switch (sortBy) {
                case "score":
                    return b.score - a.score;
                case "priority":
                    const priorityOrder = { hot: 3, warm: 2, cold: 1 };
                    return (
                        priorityOrder[b.priority] - priorityOrder[a.priority]
                    );
                case "date":
                default:
                    return (
                        new Date(b.createdAt).getTime() -
                        new Date(a.createdAt).getTime()
                    );
            }
        });

        return filtered;
    }, [
        leads,
        searchQuery,
        statusFilter,
        priorityFilter,
        sourceFilter,
        sortBy,
    ]);

    // Calculate stats
    const stats = {
        total: leads.length,
        new: leads.filter((l) => l.status === "new").length,
        hot: leads.filter((l) => l.priority === "hot").length,
        avgScore: Math.round(
            leads.reduce((sum, l) => sum + l.score, 0) / leads.length
        ),
    };

    // Get unique sources for filter
    const sources = Array.from(new Set(leads.map((l) => l.source)));

    return (
        <div className={cn("space-y-4", className)}>
            {/* Header with Stats */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold">Lead Inbox</h2>
                    <p className="text-sm text-gray-600 mt-1">
                        {stats.new} new leads • {stats.hot} hot • Avg score:{" "}
                        {stats.avgScore}
                    </p>
                </div>
                <div className="flex gap-2">
                    <Select
                        value={sortBy}
                        onValueChange={(v: any) => setSortBy(v)}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="date">Latest</SelectItem>
                            <SelectItem value="score">Score</SelectItem>
                            <SelectItem value="priority">Priority</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-3">
                {/* Search */}
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>

                {/* Filters */}
                <div className="flex gap-2">
                    <Select
                        value={statusFilter}
                        onValueChange={setStatusFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="new">New</SelectItem>
                            <SelectItem value="contacted">Contacted</SelectItem>
                            <SelectItem value="qualified">Qualified</SelectItem>
                            <SelectItem value="converted">Converted</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={priorityFilter}
                        onValueChange={setPriorityFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Priority" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Priority</SelectItem>
                            <SelectItem value="hot">Hot</SelectItem>
                            <SelectItem value="warm">Warm</SelectItem>
                            <SelectItem value="cold">Cold</SelectItem>
                        </SelectContent>
                    </Select>

                    <Select
                        value={sourceFilter}
                        onValueChange={setSourceFilter}
                    >
                        <SelectTrigger className="w-32">
                            <SelectValue placeholder="Source" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Sources</SelectItem>
                            {sources.map((source) => (
                                <SelectItem key={source} value={source}>
                                    {source}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Leads List */}
            <div className="space-y-2">
                {filteredLeads.map((lead) => (
                    <LeadCard
                        key={lead.id}
                        lead={lead}
                        onClick={() => onLeadClick(lead)}
                        onQuickReply={() => onQuickReply(lead.id)}
                        onMarkAsRead={() => onMarkAsRead(lead.id)}
                    />
                ))}

                {filteredLeads.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                        <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="text-lg font-medium">No leads found</p>
                        <p className="text-sm">Try adjusting your filters</p>
                    </div>
                )}
            </div>
        </div>
    );
}

// Lead Card Component
interface LeadCardProps {
    lead: Lead;
    onClick: () => void;
    onQuickReply: () => void;
    onMarkAsRead: () => void;
}

function LeadCard({
    lead,
    onClick,
    onQuickReply,
    onMarkAsRead,
}: LeadCardProps) {
    const priorityColors = {
        hot: "bg-red-100 text-red-800 border-red-300",
        warm: "bg-yellow-100 text-yellow-800 border-yellow-300",
        cold: "bg-blue-100 text-blue-800 border-blue-300",
    };

    const statusColors = {
        new: "bg-green-100 text-green-800",
        contacted: "bg-blue-100 text-blue-800",
        qualified: "bg-purple-100 text-purple-800",
        unqualified: "bg-gray-100 text-gray-800",
        converted: "bg-emerald-100 text-emerald-800",
    };

    const isUnread = lead.status === "new";
    const isHot = lead.priority === "hot";

    return (
        <div
            onClick={onClick}
            className={cn(
                "relative p-4 rounded-lg border-2 transition-all cursor-pointer",
                "hover:shadow-md hover:border-gray-300",
                isUnread && "bg-blue-50 border-blue-200",
                !isUnread && "bg-white border-gray-200",
                isHot && "border-l-4 border-l-red-500"
            )}
        >
            <div className="flex items-start justify-between gap-4">
                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h3
                            className={cn(
                                "font-semibold truncate",
                                isUnread && "text-primary"
                            )}
                        >
                            {lead.name}
                        </h3>
                        {isUnread && (
                            <Badge variant="outline" className="bg-blue-100">
                                NEW
                            </Badge>
                        )}
                        <Badge
                            variant="outline"
                            className={priorityColors[lead.priority]}
                        >
                            {lead.priority.toUpperCase()}
                        </Badge>
                        <Badge className={statusColors[lead.status]}>
                            {lead.status}
                        </Badge>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                        <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                        </span>
                        {lead.phone && (
                            <span className="flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                            </span>
                        )}
                        <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            {lead.source}
                        </span>
                    </div>

                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {lead.message}
                    </p>

                    {lead.listingTitle && (
                        <p className="text-xs text-gray-500">
                            Interested in:{" "}
                            <span className="font-medium">
                                {lead.listingTitle}
                            </span>
                        </p>
                    )}

                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {formatDistanceToNow(new Date(lead.createdAt), {
                                addSuffix: true,
                            })}
                        </span>
                        {lead.lastContactedAt && (
                            <span>
                                Last contacted:{" "}
                                {formatDistanceToNow(
                                    new Date(lead.lastContactedAt),
                                    {
                                        addSuffix: true,
                                    }
                                )}
                            </span>
                        )}
                    </div>
                </div>

                {/* Lead Score & Actions */}
                <div className="flex flex-col items-end gap-2">
                    <div className="flex items-center gap-1">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        <span className="text-lg font-bold text-primary">
                            {lead.score}
                        </span>
                    </div>

                    <div className="flex gap-1">
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onQuickReply();
                            }}
                        >
                            <MessageSquare className="w-4 h-4" />
                        </Button>
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMarkAsRead();
                            }}
                        >
                            <Mail className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
