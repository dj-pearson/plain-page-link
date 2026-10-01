/**
 * Video Block Component
 * Displays embedded video content
 *
 * US-237: a deaf visitor got nothing. There was nowhere to attach captions or
 * a transcript, a direct video file was dropped into an <iframe> (no native
 * controls, no <track>), and every embed was titled "Video". Now:
 *   - a direct file is a <video controls> with a captions <track>;
 *   - YouTube asks for captions on by default (cc_load_policy=1);
 *   - any video can carry a transcript, behind a "Show transcript" disclosure;
 *   - the frame's title names the video.
 */

import { useState } from "react";
import { VideoBlockConfig } from "@/types/pageBuilder";
import { Captions, Play } from "lucide-react";
import { sanitizeUrl } from "@/utils/sanitize";

interface VideoBlockProps {
    config: VideoBlockConfig;
    isEditing?: boolean;
}

type VideoSource =
    | { kind: "youtube" | "vimeo"; src: string }
    | { kind: "file"; src: string }
    | null;

/** Exported for tests. */
export function resolveVideoSource(config: VideoBlockConfig): VideoSource {
    // US-236 (SC 1.4.2): sound that starts on its own must be off. Autoplay
    // and "start muted" were independent switches, so an agent could ship a
    // page that talked at every visitor the moment it loaded.
    const muted = config.autoplay || config.muted;

    // Sanitize URL first to prevent XSS via javascript: or data: protocols
    const safeUrl = sanitizeUrl(config.videoUrl);
    if (!safeUrl) return null;

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
            // cc_load_policy=1 turns YouTube's captions on by default.
            return {
                kind: "youtube",
                src: `https://www.youtube.com/embed/${videoId}?autoplay=${config.autoplay ? "1" : "0"}&mute=${
                    muted ? "1" : "0"
                }&cc_load_policy=1`,
            };
        }
        return null;
    }

    // Vimeo - only allow known embed patterns
    if (safeUrl.includes("vimeo.com")) {
        const videoId = safeUrl.split("vimeo.com/")[1]?.split("?")[0];
        // Validate video ID format (numeric only)
        if (videoId && /^\d+$/.test(videoId)) {
            return {
                kind: "vimeo",
                src: `https://player.vimeo.com/video/${videoId}?autoplay=${config.autoplay ? "1" : "0"}&muted=${
                    muted ? "1" : "0"
                }`,
            };
        }
        return null;
    }

    // Only allow https for direct video URLs
    if (safeUrl.startsWith("https://")) {
        return { kind: "file", src: safeUrl };
    }

    return null;
}

export function VideoBlock({ config, isEditing = false }: VideoBlockProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const muted = config.autoplay || config.muted;
    const source = resolveVideoSource(config);
    const captionsUrl = config.captionsUrl ? sanitizeUrl(config.captionsUrl) : null;
    const transcript = config.transcript?.trim();
    const label = config.title?.trim();

    const handlePlay = () => {
        if (!isEditing) {
            setIsPlaying(true);
        }
    };

    if (!config.videoUrl && isEditing) {
        return (
            <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-2 border-dashed border-gray-300">
                <div className="text-center text-gray-500">
                    <Play className="w-12 h-12 mx-auto mb-2" aria-hidden="true" />
                    <p className="font-medium">No video URL</p>
                    <p className="text-sm">Add a YouTube or Vimeo URL</p>
                </div>
            </div>
        );
    }

    const frameTitle = label
        ? `Video: ${label}`
        : source?.kind === "youtube"
          ? "YouTube video"
          : source?.kind === "vimeo"
            ? "Vimeo video"
            : "Video";

    const renderPlayer = () => {
        if (source?.kind === "file") {
            // Native controls (keyboard-operable, caption toggle) and a real
            // captions track. The thumbnail is the poster, so no overlay.
            return (
                <video
                    src={source.src}
                    controls
                    playsInline
                    preload="metadata"
                    poster={config.thumbnail || undefined}
                    autoPlay={config.autoplay && !isEditing}
                    muted={muted}
                    aria-label={label || undefined}
                    // A cross-origin <track> loads only in CORS mode.
                    crossOrigin={captionsUrl ? "anonymous" : undefined}
                    className="w-full h-full"
                >
                    {captionsUrl && <track kind="captions" src={captionsUrl} srcLang="en" label="English" default />}
                </video>
            );
        }

        if (!isPlaying && config.thumbnail) {
            return (
                // Thumbnail with play button
                <div className="relative w-full h-full">
                    {/* The button names the video; the thumbnail is decorative. */}
                    <img src={config.thumbnail} alt="" className="w-full h-full object-cover" />
                    <button
                        type="button"
                        onClick={handlePlay}
                        disabled={isEditing}
                        // US-233: this button had no accessible name.
                        aria-label={label ? `Play video: ${label}` : "Play video"}
                        className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/40 transition-colors group focus-visible:ring-2 focus-visible:ring-white"
                    >
                        <span className="w-16 h-16 bg-white rounded-full flex items-center justify-center group-hover:scale-110 transition-transform" aria-hidden="true">
                            <Play className="w-8 h-8 text-primary ml-1" />
                        </span>
                    </button>
                </div>
            );
        }

        return (
            // Embedded video player
            <iframe
                src={source?.src ?? ""}
                title={frameTitle}
                className="w-full h-full"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
            />
        );
    };

    return (
        <div className="space-y-3">
            {/* Title */}
            {config.title && (
                <h3 className="text-xl font-semibold text-center">
                    {config.title}
                </h3>
            )}

            {/* Video */}
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">{renderPlayer()}</div>

            {transcript && (
                <details className="rounded-lg border px-4 py-2">
                    <summary className="cursor-pointer py-1 font-medium min-h-[44px] flex items-center">
                        Show transcript
                    </summary>
                    <div className="whitespace-pre-wrap pb-2 text-sm leading-relaxed">{transcript}</div>
                </details>
            )}

            {isEditing && !transcript && !(source?.kind === "file" && captionsUrl) && (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Captions className="h-4 w-4 shrink-0" aria-hidden="true" />
                    Add captions or a transcript so visitors who are deaf or hard of hearing can follow this video.
                </p>
            )}
        </div>
    );
}
