/**
 * Video Block Component
 * Displays embedded video content
 */

import { useState } from "react";
import { VideoBlockConfig } from "@/types/pageBuilder";
import { Play } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface VideoBlockProps {
    config: VideoBlockConfig;
    isEditing?: boolean;
}

export function VideoBlock({ config, isEditing = false }: VideoBlockProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    // US-236 (SC 1.4.2): sound that starts on its own must be off. Autoplay
    // and "start muted" were independent switches, so an agent could ship a
    // page that talked at every visitor the moment it loaded.
    const muted = config.autoplay || config.muted;

    // Extract video ID from URL and return safe embed URL
    const getVideoEmbedUrl = (): string => {
        const url = config.videoUrl;

        // Sanitize URL first to prevent XSS via javascript: or data: protocols
        const safeUrl = sanitizeUrl(url);
        if (!safeUrl) return "";

        // YouTube - only allow known embed patterns
        if (safeUrl.includes("youtube.com") || safeUrl.includes("youtu.be")) {
            let videoId = "";
            if (safeUrl.includes("youtube.com/watch?v=")) {
                videoId = safeUrl.split("v=")[1]?.split("&")[0];
            } else if (safeUrl.includes("youtu.be/")) {
                videoId = safeUrl.split("youtu.be/")[1]?.split("?")[0];
            }
            // Validate video ID format (alphanumeric + dash/underscore)
            if (videoId && /^[\w-]+$/.test(videoId)) {
                return `https://www.youtube.com/embed/${videoId}?autoplay=${
                    config.autoplay ? "1" : "0"
                }&mute=${muted ? "1" : "0"}`;
            }
            return "";
        }

        // Vimeo - only allow known embed patterns
        if (safeUrl.includes("vimeo.com")) {
            const videoId = safeUrl.split("vimeo.com/")[1]?.split("?")[0];
            // Validate video ID format (numeric only)
            if (videoId && /^\d+$/.test(videoId)) {
                return `https://player.vimeo.com/video/${videoId}?autoplay=${
                    config.autoplay ? "1" : "0"
                }&muted=${muted ? "1" : "0"}`;
            }
            return "";
        }

        // Only allow https for direct video URLs
        if (safeUrl.startsWith("https://")) {
            return safeUrl;
        }

        return "";
    };

    const handlePlay = () => {
        if (!isEditing) {
            setIsPlaying(true);
        }
    };

    if (!config.videoUrl && isEditing) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                    <Play className="w-12 h-12 mx-auto mb-2" />
                    <p className="font-medium">No video URL</p>
                    <p className="text-sm">Add a YouTube or Vimeo URL</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Title */}
            {config.title && (
                <h3 className="text-xl font-semibold text-center">
                    {config.title}
                </h3>
            )}

            {/* Video */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
                {!isPlaying && config.thumbnail ? (
                    // Thumbnail with play button
                    <div className="relative w-full h-full">
                        {/* The button names the video; the thumbnail is decorative. */}
                        <img src={config.thumbnail} alt="" className="w-full h-full object-cover" />
                        <button
                            type="button"
                            onClick={handlePlay}
                            disabled={isEditing}
                            // US-233: this button had no accessible name.
                            aria-label={config.title ? `Play video: ${config.title}` : "Play video"}
                            className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group focus-visible:ring-2 focus-visible:ring-white"
                        >
                            <span className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" aria-hidden="true">
                                <Play className="w-8 h-8 text-primary ml-1" />
                            </span>
                        </button>
                    </div>
                ) : (
                    // Embedded video player
                    <iframe
                        src={getVideoEmbedUrl()}
                        title={config.title || "Video"}
                        className="w-full h-full"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                    />
                )}
            </div>
        </div>
    );
}
