/**
 * Lead Detail View Component
 * Detailed view of a single lead with timeline and actions
 */

import { useState } from "react";
import {
    X,
    Mail,
    Phone,
    MapPin,
    Clock,
    Star,
    MessageSquare,
    Home,
    TrendingUp,
    Calendar,
    User,
    Tag,
    ExternalLink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import { toast } from "sonner";

interface Lead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    message: string;
    listingTitle?: string;
    listingId?: string;
    listingImage?: string;
    source: string;
    score: number;
    status: "new" | "contacted" | "qualified" | "unqualified" | "converted";
    priority: "hot" | "warm" | "cold";
    createdAt: string;
    lastContactedAt?: string;
    tags?: string[];
    notes?: string;
    timeline?: TimelineEvent[];
}

interface TimelineEvent {
    id: string;
    type: "note" | "email" | "call" | "meeting" | "status_change";
    content: string;
    timestamp: string;
    user?: string;
}

interface LeadDetailViewProps {
    lead: Lead;
    onClose: () => void;
    onUpdateStatus: (status: Lead["status"]) => Promise<void>;
    onAddNote: (note: string) => Promise<void>;
    onSendEmail: (subject: string, body: string) => Promise<void>;
    onScheduleCall?: () => void;
    className?: string;
}

export function LeadDetailView({
    lead,
    onClose,
    onUpdateStatus,
    onAddNote,
    onSendEmail,
    onScheduleCall,
    className,
}: LeadDetailViewProps) {
    const [activeTab, setActiveTab] = useState<
        "overview" | "timeline" | "notes"
    >("overview");
    const [newNote, setNewNote] = useState("");
    const [isAddingNote, setIsAddingNote] = useState(false);

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

    const handleAddNote = async () => {
        if (!newNote.trim()) {
            toast.error("Please enter a note");
            return;
        }

        setIsAddingNote(true);
        try {
            await onAddNote(newNote);
            setNewNote("");
            toast.success("Note added");
        } catch (error) {
            toast.error("Failed to add note");
        } finally {
            setIsAddingNote(false);
        }
    };

    return (
        <div
            className={cn(
                "fixed inset-0 bg-black/50 z-50 overflow-y-auto",
                className
            )}
        >
            <div className="min-h-screen flex items-center justify-center p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl">
                    {/* Header */}
                    <div className="p-6 border-b">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <div className="flex items-center gap-3 mb-2">
                                    <h2 className="text-2xl font-bold">
                                        {lead.name}
                                    </h2>
                                    <Badge
                                        variant="outline"
                                        className={
                                            priorityColors[lead.priority]
                                        }
                                    >
                                        {lead.priority.toUpperCase()}
                                    </Badge>
                                    <Badge
                                        className={statusColors[lead.status]}
                                    >
                                        {lead.status}
                                    </Badge>
                                </div>
                                <div className="flex items-center gap-4 text-sm text-gray-600">
                                    <span className="flex items-center gap-1">
                                        <Mail className="w-4 h-4" />
                                        {lead.email}
                                    </span>
                                    {lead.phone && (
                                        <span className="flex items-center gap-1">
                                            <Phone className="w-4 h-4" />
                                            {lead.phone}
                                        </span>
                                    )}
                                    <span className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4" />
                                        {lead.source}
                                    </span>
                                </div>
                            </div>
                            <Button variant="ghost" size="sm" onClick={onClose}>
                                <X className="w-5 h-5" />
                            </Button>
                        </div>

                        {/* Lead Score */}
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-primary" />
                                <span className="font-medium">Lead Score:</span>
                                <span className="text-2xl font-bold text-primary">
                                    {lead.score}
                                </span>
                                <span className="text-sm text-gray-600">
                                    /100
                                </span>
                            </div>
                            <div className="text-sm text-gray-600">
                                Created{" "}
                                {formatDistanceToNow(new Date(lead.createdAt), {
                                    addSuffix: true,
                                })}
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="mt-4 flex gap-2">
                            <Button
                                className="gap-2"
                                onClick={() =>
                                    window.open(`mailto:${lead.email}`)
                                }
                            >
                                <Mail className="w-4 h-4" />
                                Email
                            </Button>
                            {lead.phone && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={() =>
                                        window.open(`tel:${lead.phone}`)
                                    }
                                >
                                    <Phone className="w-4 h-4" />
                                    Call
                                </Button>
                            )}
                            {onScheduleCall && (
                                <Button
                                    variant="outline"
                                    className="gap-2"
                                    onClick={onScheduleCall}
                                >
                                    <Calendar className="w-4 h-4" />
                                    Schedule
                                </Button>
                            )}
                            <Select
                                value={lead.status}
                                onValueChange={(v) =>
                                    onUpdateStatus(v as Lead["status"])
                                }
                            >
                                <SelectTrigger className="w-40">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">New</SelectItem>
                                    <SelectItem value="contacted">
                                        Contacted
                                    </SelectItem>
                                    <SelectItem value="qualified">
                                        Qualified
                                    </SelectItem>
                                    <SelectItem value="unqualified">
                                        Unqualified
                                    </SelectItem>
                                    <SelectItem value="converted">
                                        Converted
                                    </SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b">
                        <div className="flex gap-4 px-6">
                            {["overview", "timeline", "notes"].map((tab) => (
                                <button
                                    key={tab}
                                    onClick={() =>
                                        setActiveTab(tab as typeof activeTab)
                                    }
                                    className={cn(
                                        "py-3 px-1 border-b-2 font-medium text-sm capitalize transition-colors",
                                        activeTab === tab
                                            ? "border-primary text-primary"
                                            : "border-transparent text-gray-600 hover:text-gray-900"
                                    )}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6 max-h-[60vh] overflow-y-auto">
                        {activeTab === "overview" && (
                            <div className="space-y-6">
                                {/* Original Message */}
                                <div>
                                    <h3 className="font-semibold mb-2 flex items-center gap-2">
                                        <MessageSquare className="w-4 h-4" />
                                        Original Message
                                    </h3>
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-700">
                                            {lead.message}
                                        </p>
                                    </div>
                                </div>

                                {/* Listing Interest */}
                                {lead.listingTitle && (
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Home className="w-4 h-4" />
                                            Interested Property
                                        </h3>
                                        <div className="p-4 bg-gray-50 rounded-lg flex items-center gap-4">
                                            {lead.listingImage && (
                                                <img
                                                    src={lead.listingImage}
                                                    alt={lead.listingTitle}
                                                    className="w-24 h-24 object-cover rounded"
                                                />
                                            )}
                                            <div className="flex-1">
                                                <p className="font-medium">
                                                    {lead.listingTitle}
                                                </p>
                                                <Button
                                                    variant="link"
                                                    size="sm"
                                                    className="gap-1 p-0 h-auto"
                                                    onClick={() => {
                                                        // Navigate to listing
                                                    }}
                                                >
                                                    View Listing
                                                    <ExternalLink className="w-3 h-3" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Tags */}
                                {lead.tags && lead.tags.length > 0 && (
                                    <div>
                                        <h3 className="font-semibold mb-2 flex items-center gap-2">
                                            <Tag className="w-4 h-4" />
                                            Tags
                                        </h3>
                                        <div className="flex flex-wrap gap-2">
                                            {lead.tags.map((tag) => (
                                                <Badge
                                                    key={tag}
                                                    variant="outline"
                                                >
                                                    {tag}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "timeline" && (
                            <div className="space-y-4">
                                {lead.timeline && lead.timeline.length > 0 ? (
                                    lead.timeline.map((event) => (
                                        <TimelineItem
                                            key={event.id}
                                            event={event}
                                        />
                                    ))
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                        <p>No timeline events yet</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === "notes" && (
                            <div className="space-y-4">
                                {/* Add Note Form */}
                                <div className="space-y-2">
                                    <Textarea
                                        value={newNote}
                                        onChange={(e) =>
                                            setNewNote(e.target.value)
                                        }
                                        placeholder="Add a note about this lead..."
                                        rows={3}
                                    />
                                    <Button
                                        onClick={handleAddNote}
                                        disabled={
                                            isAddingNote || !newNote.trim()
                                        }
                                        className="w-full"
                                    >
                                        Add Note
                                    </Button>
                                </div>

                                {/* Existing Notes */}
                                {lead.notes && (
                                    <div className="p-4 bg-gray-50 rounded-lg">
                                        <p className="text-gray-700 whitespace-pre-wrap">
                                            {lead.notes}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

// Timeline Item Component
function TimelineItem({ event }: { event: TimelineEvent }) {
    const getIcon = () => {
        switch (event.type) {
            case "email":
                return <Mail className="w-4 h-4" />;
            case "call":
                return <Phone className="w-4 h-4" />;
            case "meeting":
                return <Calendar className="w-4 h-4" />;
            case "status_change":
                return <TrendingUp className="w-4 h-4" />;
            case "note":
            default:
                return <MessageSquare className="w-4 h-4" />;
        }
    };

    return (
        <div className="flex gap-3">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                {getIcon()}
            </div>
            <div className="flex-1">
                <p className="text-sm text-gray-700">{event.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                    {format(
                        new Date(event.timestamp),
                        "MMM d, yyyy 'at' h:mm a"
                    )}
                    {event.user && ` • ${event.user}`}
                </p>
            </div>
        </div>
    );
}
