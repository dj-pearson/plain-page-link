/**
 * Hot Lead Alert Component
 * Real-time notifications for high-priority leads
 */

import { useState, useEffect } from "react";
import { Flame, X, Phone, Mail, Eye, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { toast } from "sonner";

interface HotLead {
    id: string;
    name: string;
    email: string;
    phone?: string;
    score: number;
    source: string;
    message: string;
    listingTitle?: string;
    createdAt: string;
}

interface HotLeadAlertProps {
    hotLeads: HotLead[];
    onView: (leadId: string) => void;
    onDismiss: (leadId: string) => void;
    onQuickCall?: (leadId: string) => void;
    autoHide?: boolean;
    autoHideDelay?: number; // milliseconds
    soundEnabled?: boolean;
    className?: string;
}

export function HotLeadAlert({
    hotLeads,
    onView,
    onDismiss,
    onQuickCall,
    autoHide = false,
    autoHideDelay = 30000,
    soundEnabled = true,
    className,
}: HotLeadAlertProps) {
    const [visibleLeads, setVisibleLeads] = useState<Set<string>>(new Set());
    const [dismissedLeads, setDismissedLeads] = useState<Set<string>>(
        new Set()
    );

    // Track which leads are visible
    useEffect(() => {
        const newLeadIds = hotLeads.map((l) => l.id);
        const currentVisible = new Set(visibleLeads);

        // Find truly new leads (not previously visible and not dismissed)
        const newLeads = newLeadIds.filter(
            (id) => !currentVisible.has(id) && !dismissedLeads.has(id)
        );

        if (newLeads.length > 0) {
            // Show toast notification
            toast.success(`${newLeads.length} hot lead(s) just arrived!`, {
                icon: <Flame className="w-4 h-4 text-orange-600" />,
            });

            // Play notification sound
            if (soundEnabled) {
                playNotificationSound();
            }

            // Update visible leads
            newLeads.forEach((id) => currentVisible.add(id));
            setVisibleLeads(currentVisible);

            // Auto-hide if enabled
            if (autoHide) {
                setTimeout(() => {
                    newLeads.forEach((id) => handleDismiss(id));
                }, autoHideDelay);
            }
        }
    }, [hotLeads]);

    const handleDismiss = (leadId: string) => {
        setDismissedLeads((prev) => new Set(prev).add(leadId));
        onDismiss(leadId);
    };

    const activeLeads = hotLeads.filter((lead) => !dismissedLeads.has(lead.id));

    if (activeLeads.length === 0) return null;

    return (
        <div className={cn("space-y-2", className)}>
            {activeLeads.map((lead) => (
                <HotLeadCard
                    key={lead.id}
                    lead={lead}
                    onView={() => onView(lead.id)}
                    onDismiss={() => handleDismiss(lead.id)}
                    onQuickCall={
                        onQuickCall ? () => onQuickCall(lead.id) : undefined
                    }
                />
            ))}
        </div>
    );
}

// Individual Hot Lead Card
interface HotLeadCardProps {
    lead: HotLead;
    onView: () => void;
    onDismiss: () => void;
    onQuickCall?: () => void;
}

function HotLeadCard({
    lead,
    onView,
    onDismiss,
    onQuickCall,
}: HotLeadCardProps) {
    const [isAnimating, setIsAnimating] = useState(true);

    useEffect(() => {
        // Stop animation after 3 seconds
        const timer = setTimeout(() => setIsAnimating(false), 3000);
        return () => clearTimeout(timer);
    }, []);

    return (
        <div
            className={cn(
                "relative p-4 rounded-lg border-2 border-orange-500 bg-orange-50 shadow-lg",
                "animate-in slide-in-from-top-5 duration-300",
                isAnimating && "animate-pulse"
            )}
        >
            {/* Hot Badge */}
            <div className="absolute -top-2 -right-2">
                <Badge className="bg-orange-600 text-white gap-1 animate-bounce">
                    <Flame className="w-3 h-3" />
                    HOT LEAD
                </Badge>
            </div>

            <div className="flex items-start justify-between gap-4">
                {/* Lead Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                        <h4 className="font-bold text-lg">{lead.name}</h4>
                        <Badge
                            variant="outline"
                            className="bg-red-100 text-red-800"
                        >
                            Score: {lead.score}
                        </Badge>
                    </div>

                    <div className="space-y-1 text-sm mb-3">
                        <div className="flex items-center gap-2 text-gray-700">
                            <Mail className="w-3 h-3" />
                            {lead.email}
                        </div>
                        {lead.phone && (
                            <div className="flex items-center gap-2 text-gray-700">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                            </div>
                        )}
                        <div className="text-gray-600">From: {lead.source}</div>
                    </div>

                    {lead.listingTitle && (
                        <p className="text-sm font-medium text-gray-900 mb-2">
                            Interested in: {lead.listingTitle}
                        </p>
                    )}

                    <p className="text-sm text-gray-700 line-clamp-2 mb-2">
                        {lead.message}
                    </p>

                    <p className="text-xs text-gray-500">
                        Received{" "}
                        {formatDistanceToNow(new Date(lead.createdAt), {
                            addSuffix: true,
                        })}
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2">
                    <Button
                        size="sm"
                        onClick={onDismiss}
                        variant="ghost"
                        className="h-8 w-8 p-0"
                    >
                        <X className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-3">
                {onQuickCall && lead.phone && (
                    <Button
                        size="sm"
                        onClick={onQuickCall}
                        className="flex-1 bg-green-600 hover:bg-green-700 gap-1"
                    >
                        <Phone className="w-4 h-4" />
                        Call Now
                    </Button>
                )}
                <Button
                    size="sm"
                    onClick={onView}
                    className="flex-1 bg-orange-600 hover:bg-orange-700 gap-1"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>

            {/* Urgency Indicator */}
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 rounded-b-lg overflow-hidden">
                <div
                    className="h-full bg-orange-600 animate-pulse"
                    style={{ width: `${lead.score}%` }}
                />
            </div>
        </div>
    );
}

// Floating Hot Lead Indicator (for header/nav)
export function HotLeadIndicator({
    count,
    onClick,
}: {
    count: number;
    onClick: () => void;
}) {
    if (count === 0) return null;

    return (
        <Button
            variant="outline"
            size="sm"
            onClick={onClick}
            className="relative gap-2 border-orange-500 bg-orange-50 hover:bg-orange-100 text-orange-900 animate-pulse"
        >
            <Flame className="w-4 h-4 text-orange-600" />
            <span className="font-bold">
                {count} Hot Lead{count > 1 ? "s" : ""}
            </span>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-ping" />
        </Button>
    );
}

// Hot Lead Toast Notification (for global use)
export function showHotLeadToast(lead: HotLead, onView: () => void) {
    toast.custom(
        (t) => (
            <div className="bg-white p-4 rounded-lg shadow-xl border-2 border-orange-500 max-w-md">
                <div className="flex items-start gap-3">
                    <Flame className="w-6 h-6 text-orange-600 flex-shrink-0 animate-bounce" />
                    <div className="flex-1">
                        <p className="font-bold text-orange-900 mb-1">
                            🔥 Hot Lead Alert!
                        </p>
                        <p className="text-sm text-gray-900 font-medium mb-1">
                            {lead.name}
                        </p>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                            {lead.message}
                        </p>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => {
                                    onView();
                                    toast.dismiss(t);
                                }}
                                className="bg-orange-600 hover:bg-orange-700"
                            >
                                View Lead
                            </Button>
                            <Button
                                size="sm"
                                variant="outline"
                                onClick={() => toast.dismiss(t)}
                            >
                                Dismiss
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        ),
        {
            duration: 15000,
            position: "top-right",
        }
    );
}

// Helper function to play notification sound
function playNotificationSound() {
    try {
        // Create a simple beep sound using Web Audio API
        const audioContext = new (window.AudioContext ||
            (window as any).webkitAudioContext)();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
            0.01,
            audioContext.currentTime + 0.5
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.5);
    } catch (error) {
        console.warn("Could not play notification sound:", error);
    }
}
