/**
 * Lead Detail Modal
 * Full lead information with status management, notes, and quick actions
 */

import { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Mail,
    Phone,
    MessageSquare,
    Calendar,
    User,
    MapPin,
    DollarSign,
    Home,
    FileText,
    Send,
    X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatDistanceToNow } from "date-fns";
import type { Lead } from "@/types/lead";

// Extended Lead type for modal with additional fields that may be present
interface LeadWithExtras extends Lead {
    property_address?: string | null;
    budget?: string | null;
}

interface LeadNote {
    id: string;
    lead_id: string;
    note: string;
    is_system: boolean;
    created_at: string;
}

interface LeadDetailModalProps {
    lead: LeadWithExtras | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onLeadUpdated?: () => void;
}

const STATUS_OPTIONS = [
    { value: "new", label: "New", color: "bg-green-100 text-green-800" },
    { value: "contacted", label: "Contacted", color: "bg-blue-100 text-blue-800" },
    { value: "qualified", label: "Qualified", color: "bg-purple-100 text-purple-800" },
    { value: "converted", label: "Converted", color: "bg-emerald-100 text-emerald-800" },
    { value: "lost", label: "Lost", color: "bg-gray-100 text-gray-800" },
];

const QUICK_RESPONSES = [
    {
        id: "intro",
        title: "Introduction",
        template: "Hi {name}, thank you for reaching out! I'd love to help you {lead_type}. When would be a good time to chat?",
    },
    {
        id: "buyer_followup",
        title: "Buyer Follow-up",
        template: "Hi {name}, I have some great properties that match what you're looking for. Are you available for a showing this week?",
    },
    {
        id: "seller_followup",
        title: "Seller Follow-up",
        template: "Hi {name}, I'd like to schedule a time to visit your property and discuss your goals. What days work best for you?",
    },
    {
        id: "valuation",
        title: "Home Valuation",
        template: "Hi {name}, I've prepared a comparative market analysis for your property. Can we schedule a call to discuss the current market value?",
    },
];

export function LeadDetailModal({
    lead,
    open,
    onOpenChange,
    onLeadUpdated,
}: LeadDetailModalProps) {
    const [status, setStatus] = useState(lead?.status || "new");
    const [note, setNote] = useState("");
    const [notes, setNotes] = useState<LeadNote[]>([]);
    const [isSaving, setIsSaving] = useState(false);
    const [loadingNotes, setLoadingNotes] = useState(false);
    const [selectedResponse, setSelectedResponse] = useState<string>("");

    // Load notes when modal opens
    useEffect(() => {
        if (lead && open) {
            loadNotes();
        }
    }, [lead, open]);

    const loadNotes = async () => {
        if (!lead) return;

        setLoadingNotes(true);
        try {
            const { data, error } = await supabase
                .from("lead_notes")
                .select("*")
                .eq("lead_id", lead.id)
                .order("created_at", { ascending: false });

            if (error) throw error;
            setNotes(data || []);
        } catch (error) {
            console.error("Failed to load notes:", error);
        } finally {
            setLoadingNotes(false);
        }
    };

    const handleStatusChange = async (newStatus: string) => {
        if (!lead) return;

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from("leads")
                .update({ status: newStatus })
                .eq("id", lead.id);

            if (error) throw error;

            setStatus(newStatus);
            toast.success("Lead status updated");
            onLeadUpdated?.();

            // Auto-add a note about the status change
            await addNote(`Status changed to: ${newStatus}`, true);
        } catch (error) {
            console.error("Failed to update status:", error);
            toast.error("Failed to update status");
        } finally {
            setIsSaving(false);
        }
    };

    const addNote = async (noteText: string, isSystemNote: boolean = false) => {
        if (!lead || !noteText.trim()) return;

        try {
            const { data, error } = await supabase
                .from("lead_notes")
                .insert({
                    lead_id: lead.id,
                    note: noteText.trim(),
                    is_system: isSystemNote,
                })
                .select()
                .single();

            if (error) throw error;

            setNotes((prev) => [data, ...prev]);
            if (!isSystemNote) {
                setNote("");
                toast.success("Note added");
            }
        } catch (error) {
            console.error("Failed to add note:", error);
            if (!isSystemNote) {
                toast.error("Failed to add note");
            }
        }
    };

    const handleAddNote = () => {
        addNote(note, false);
    };

    const getLeadTypeIcon = () => {
        switch (lead?.lead_type) {
            case "buyer":
                return <User className="h-5 w-5" />;
            case "seller":
                return <Home className="h-5 w-5" />;
            case "valuation":
                return <DollarSign className="h-5 w-5" />;
            default:
                return <MessageSquare className="h-5 w-5" />;
        }
    };

    const fillTemplate = (template: string) => {
        return template
            .replace("{name}", lead?.name || "there")
            .replace("{lead_type}", lead?.lead_type === "buyer" ? "find your dream home" : "sell your property");
    };

    const handleSelectResponse = (responseId: string) => {
        const response = QUICK_RESPONSES.find(r => r.id === responseId);
        if (response) {
            setNote(fillTemplate(response.template));
            setSelectedResponse("");
        }
    };

    if (!lead) return null;

    const timeAgo = lead.created_at
        ? formatDistanceToNow(new Date(lead.created_at), { addSuffix: true })
        : "";

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg">
                                {getLeadTypeIcon()}
                            </div>
                            <div>
                                <DialogTitle className="text-xl">{lead.name}</DialogTitle>
                                <DialogDescription className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="capitalize">
                                        {lead.lead_type}
                                    </Badge>
                                    <span className="text-xs text-muted-foreground">
                                        {timeAgo}
                                    </span>
                                </DialogDescription>
                            </div>
                        </div>
                    </div>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Status Selector */}
                    <div className="space-y-2">
                        <Label>Lead Status</Label>
                        <Select value={status} onValueChange={handleStatusChange} disabled={isSaving}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {STATUS_OPTIONS.map((option) => (
                                    <SelectItem key={option.value} value={option.value}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className={`w-2 h-2 rounded-full ${option.color}`}
                                            />
                                            {option.label}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Contact Information */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Contact Information
                        </h3>
                        <div className="space-y-2">
                            <a
                                href={`mailto:${lead.email}`}
                                className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                            >
                                <Mail className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                <span className="flex-1 text-sm">{lead.email}</span>
                                <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                            </a>
                            {lead.phone && (
                                <a
                                    href={`tel:${lead.phone}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                                >
                                    <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    <span className="flex-1 text-sm">{lead.phone}</span>
                                    <Phone className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                            {lead.phone && (
                                <a
                                    href={`sms:${lead.phone}`}
                                    className="flex items-center gap-3 p-3 rounded-lg border hover:border-primary hover:bg-primary/5 transition-colors group"
                                >
                                    <MessageSquare className="h-4 w-4 text-muted-foreground group-hover:text-primary" />
                                    <span className="flex-1 text-sm">Send SMS</span>
                                    <Send className="h-4 w-4 text-muted-foreground group-hover:text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                </a>
                            )}
                        </div>
                    </div>

                    {/* Message */}
                    {lead.message && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Message
                            </h3>
                            <div className="p-4 bg-muted/50 rounded-lg">
                                <p className="text-sm whitespace-pre-wrap">{lead.message}</p>
                            </div>
                        </div>
                    )}

                    {/* Lead Source & Details */}
                    {(lead.source || lead.property_address || lead.budget) && (
                        <div className="space-y-2">
                            <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                                Additional Details
                            </h3>
                            <div className="grid grid-cols-2 gap-3 text-sm">
                                {lead.source && (
                                    <div className="flex items-center gap-2">
                                        <FileText className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Source:</span>
                                        <span className="font-medium">{lead.source}</span>
                                    </div>
                                )}
                                {lead.property_address && (
                                    <div className="flex items-center gap-2">
                                        <MapPin className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Property:</span>
                                        <span className="font-medium">{lead.property_address}</span>
                                    </div>
                                )}
                                {lead.budget && (
                                    <div className="flex items-center gap-2">
                                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-muted-foreground">Budget:</span>
                                        <span className="font-medium">{lead.budget}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Quick Response Templates */}
                    <div className="space-y-2">
                        <Label>Quick Response Templates</Label>
                        <Select value={selectedResponse} onValueChange={handleSelectResponse}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select a template..." />
                            </SelectTrigger>
                            <SelectContent>
                                {QUICK_RESPONSES.map((response) => (
                                    <SelectItem key={response.id} value={response.id}>
                                        {response.title}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Notes Section */}
                    <div className="space-y-3">
                        <h3 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">
                            Notes & Activity
                        </h3>

                        {/* Add Note */}
                        <div className="space-y-2">
                            <Textarea
                                value={note}
                                onChange={(e) => setNote(e.target.value)}
                                placeholder="Add a note about this lead..."
                                rows={3}
                            />
                            <Button
                                onClick={handleAddNote}
                                disabled={!note.trim()}
                                size="sm"
                                className="gap-2"
                            >
                                <Send className="h-4 w-4" />
                                Add Note
                            </Button>
                        </div>

                        {/* Notes Timeline */}
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                            {loadingNotes ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    Loading notes...
                                </p>
                            ) : notes.length === 0 ? (
                                <p className="text-sm text-muted-foreground text-center py-4">
                                    No notes yet. Add your first note above.
                                </p>
                            ) : (
                                notes.map((n) => (
                                    <div
                                        key={n.id}
                                        className={`p-3 rounded-lg border ${
                                            n.is_system
                                                ? "bg-muted/30 border-muted"
                                                : "bg-background"
                                        }`}
                                    >
                                        <p className="text-sm">{n.note}</p>
                                        <p className="text-xs text-muted-foreground mt-1">
                                            {formatDistanceToNow(new Date(n.created_at), {
                                                addSuffix: true,
                                            })}
                                        </p>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
