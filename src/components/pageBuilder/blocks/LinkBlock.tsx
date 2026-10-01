/**
 * Link Block Component
 * Displays a customizable link button
 */

import type React from "react";
import { LinkBlockConfig } from "@/types/pageBuilder";
import { Button } from "@/components/ui/button";
import { ExternalLink, ChevronRight } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface LinkBlockProps {
    config: LinkBlockConfig;
    isEditing?: boolean;
}

export function LinkBlock({ config, isEditing = false }: LinkBlockProps) {
    // US-233: these were <div onClick> navigating with window.location — not
    // links to a keyboard, a screen reader, middle-click or "copy link". A real
    // <a href> now; in the editor (or with an unsafe URL) a plain element.
    const safeUrl = isEditing ? null : sanitizeUrl(config.url);
    const linkProps = safeUrl
        ? {
              href: safeUrl,
              ...(config.openInNewTab ? { target: "_blank", rel: "noopener noreferrer" } : {}),
          }
        : null;
    const newTabHint = config.openInNewTab ? <span className="sr-only"> (opens in a new tab)</span> : null;

    const Shell = ({ className, children }: { className: string; children: React.ReactNode }) =>
        linkProps ? (
            <a {...linkProps} className={className}>
                {children}
                {newTabHint}
            </a>
        ) : (
            <div className={className}>{children}</div>
        );

    const renderButton = () => (
        <Button
            asChild={!!linkProps}
            disabled={!linkProps}
            className="w-full gap-2 justify-between"
            variant={config.style === "minimal" ? "ghost" : "default"}
            size="lg"
        >
            {linkProps ? (
                <a {...linkProps}>
                    <span className="flex items-center gap-2">
                        {config.icon && <span aria-hidden="true">{config.icon}</span>}
                        {config.title}
                    </span>
                    {config.openInNewTab ? (
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                    ) : (
                        <ChevronRight className="w-4 h-4" aria-hidden="true" />
                    )}
                    {newTabHint}
                </a>
            ) : (
                <span className="flex w-full items-center justify-between gap-2">
                    <span className="flex items-center gap-2">
                        {config.icon && <span aria-hidden="true">{config.icon}</span>}
                        {config.title}
                    </span>
                    <ChevronRight className="w-4 h-4" aria-hidden="true" />
                </span>
            )}
        </Button>
    );

    const renderCard = () => (
        <Shell
            className={`block p-4 rounded-lg border bg-white hover:shadow-md transition-all ${
                linkProps ? "hover:border-primary focus-visible:ring-2 focus-visible:ring-primary" : ""
            }`}
        >
            <span className="flex items-center justify-between">
                <span className="flex items-center gap-3">
                    {config.icon && (
                        <span className="text-2xl" aria-hidden="true">{config.icon}</span>
                    )}
                    <span className="font-semibold">{config.title}</span>
                </span>
                {config.openInNewTab ? (
                    <ExternalLink className="w-5 h-5 text-gray-500" aria-hidden="true" />
                ) : (
                    <ChevronRight className="w-5 h-5 text-gray-500" aria-hidden="true" />
                )}
            </span>
        </Shell>
    );

    const renderMinimal = () => (
        <Shell
            className={`block py-3 px-4 text-center transition-colors ${
                linkProps ? "hover:text-primary underline-offset-4 hover:underline" : ""
            }`}
        >
            <span className="flex items-center justify-center gap-2">
                {config.icon && <span aria-hidden="true">{config.icon}</span>}
                <span className="font-medium">{config.title}</span>
                {config.openInNewTab && <ExternalLink className="w-4 h-4" aria-hidden="true" />}
            </span>
        </Shell>
    );

    return (
        <div className="w-full max-w-md mx-auto">
            {config.style === "button" && renderButton()}
            {config.style === "card" && renderCard()}
            {config.style === "minimal" && renderMinimal()}
        </div>
    );
}
