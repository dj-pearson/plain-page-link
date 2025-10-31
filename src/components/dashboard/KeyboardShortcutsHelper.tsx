/**
 * Keyboard Shortcuts Helper Component
 * Displays available shortcuts and handles registration
 */

import { useState, useEffect } from "react";
import { Keyboard, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Shortcut {
    key: string;
    description: string;
    action: () => void;
    category?: string;
}

interface KeyboardShortcutsProps {
    shortcuts: Shortcut[];
    className?: string;
}

export function KeyboardShortcutsHelper({
    shortcuts,
    className,
}: KeyboardShortcutsProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [recentlyUsed, setRecentlyUsed] = useState<string>("");

    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if typing in input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            // Show help with ?
            if (e.key === "?" && !e.shiftKey) {
                e.preventDefault();
                setIsOpen((prev) => !prev);
                return;
            }

            // Execute shortcuts
            const shortcut = shortcuts.find(
                (s) => s.key.toLowerCase() === e.key.toLowerCase()
            );
            if (shortcut) {
                e.preventDefault();
                shortcut.action();
                setRecentlyUsed(shortcut.key);
                setTimeout(() => setRecentlyUsed(""), 1000);
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [shortcuts]);

    // Group shortcuts by category
    const groupedShortcuts = shortcuts.reduce((acc, shortcut) => {
        const category = shortcut.category || "General";
        if (!acc[category]) acc[category] = [];
        acc[category].push(shortcut);
        return acc;
    }, {} as Record<string, Shortcut[]>);

    return (
        <>
            {/* Floating Help Button */}
            <Button
                variant="outline"
                size="sm"
                onClick={() => setIsOpen(true)}
                className={cn(
                    "fixed bottom-4 right-4 md:bottom-6 md:right-6 z-30",
                    "shadow-lg gap-2",
                    className
                )}
            >
                <Keyboard className="w-4 h-4" />
                <span className="hidden md:inline">Shortcuts</span>
                <kbd className="px-1.5 py-0.5 text-xs bg-gray-100 rounded border">
                    ?
                </kbd>
            </Button>

            {/* Recently Used Indicator */}
            {recentlyUsed && (
                <div className="fixed top-20 right-4 bg-primary text-white px-4 py-2 rounded-lg shadow-lg animate-in slide-in-from-top-5 duration-300 z-50">
                    <div className="flex items-center gap-2">
                        <kbd className="px-2 py-1 bg-white/20 rounded text-sm font-mono">
                            {recentlyUsed}
                        </kbd>
                        <span className="text-sm">Shortcut used!</span>
                    </div>
                </div>
            )}

            {/* Shortcuts Panel */}
            {isOpen && (
                <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b">
                            <div className="flex items-center gap-2">
                                <Keyboard className="w-5 h-5" />
                                <h3 className="font-semibold text-lg">
                                    Keyboard Shortcuts
                                </h3>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setIsOpen(false)}
                            >
                                <X className="w-4 h-4" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
                            {Object.entries(groupedShortcuts).map(
                                ([category, categoryShortcuts]) => (
                                    <div
                                        key={category}
                                        className="mb-6 last:mb-0"
                                    >
                                        <h4 className="font-semibold text-sm text-gray-600 mb-3 uppercase tracking-wide">
                                            {category}
                                        </h4>
                                        <div className="space-y-2">
                                            {categoryShortcuts.map(
                                                (shortcut) => (
                                                    <div
                                                        key={shortcut.key}
                                                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                                                    >
                                                        <span className="text-sm">
                                                            {
                                                                shortcut.description
                                                            }
                                                        </span>
                                                        <kbd className="px-3 py-1.5 bg-white border border-gray-300 rounded shadow-sm font-mono text-sm">
                                                            {shortcut.key.toUpperCase()}
                                                        </kbd>
                                                    </div>
                                                )
                                            )}
                                        </div>
                                    </div>
                                )
                            )}

                            {/* Help Footer */}
                            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <p className="text-sm text-blue-900">
                                    <strong>💡 Pro Tip:</strong> Press{" "}
                                    <kbd className="px-2 py-1 bg-white rounded text-xs">
                                        ?
                                    </kbd>{" "}
                                    anytime to toggle this panel. Shortcuts
                                    don't work when typing in text fields.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

// Hook to manage keyboard shortcuts
export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
    useEffect(() => {
        const handleKeyPress = (e: KeyboardEvent) => {
            // Don't trigger if typing in input
            if (
                e.target instanceof HTMLInputElement ||
                e.target instanceof HTMLTextAreaElement
            ) {
                return;
            }

            const shortcut = shortcuts.find(
                (s) => s.key.toLowerCase() === e.key.toLowerCase()
            );
            if (shortcut) {
                e.preventDefault();
                shortcut.action();
            }
        };

        window.addEventListener("keydown", handleKeyPress);
        return () => window.removeEventListener("keydown", handleKeyPress);
    }, [shortcuts]);
}
