/**
 * Restore Draft Prompt Component
 * Shows a prompt to restore auto-saved draft data
 */

import { Button } from './button';
import { Card } from './card';
import { FileText, X } from 'lucide-react';

interface RestoreDraftPromptProps {
    show: boolean;
    onRestore: () => void;
    onDiscard: () => void;
}

export function RestoreDraftPrompt({ show, onRestore, onDiscard }: RestoreDraftPromptProps) {
    if (!show) return null;

    return (
        <Card className="border-blue-200 bg-blue-50 p-4 mb-4 animate-in slide-in-from-top-2">
            <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <FileText className="w-5 h-5 text-blue-600" />
                    </div>
                </div>
                <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-blue-900 text-sm">
                        Draft Found
                    </h4>
                    <p className="text-sm text-blue-700 mt-1">
                        We found an auto-saved draft from your previous session. Would you like to restore it?
                    </p>
                    <div className="flex gap-2 mt-3">
                        <Button
                            onClick={onRestore}
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700"
                        >
                            Restore Draft
                        </Button>
                        <Button
                            onClick={onDiscard}
                            size="sm"
                            variant="outline"
                            className="border-blue-200 hover:bg-blue-100"
                        >
                            Discard
                        </Button>
                    </div>
                </div>
                <button
                    onClick={onDiscard}
                    className="flex-shrink-0 p-1 hover:bg-blue-100 rounded transition-colors"
                    aria-label="Dismiss"
                >
                    <X className="w-4 h-4 text-blue-600" />
                </button>
            </div>
        </Card>
    );
}
