/**
 * Social Share Buttons Component
 * Buttons for sharing pages on social media
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Facebook,
    Twitter,
    Linkedin,
    Mail,
    Copy,
    Check,
    Share2,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

interface SocialShareButtonsProps {
    url: string;
    title: string;
    description?: string;
    hashtags?: string[];
    className?: string;
}

export function SocialShareButtons({
    url,
    title,
    description,
    hashtags = [],
    className = "",
}: SocialShareButtonsProps) {
    const [copied, setCopied] = useState(false);

    const encodedUrl = encodeURIComponent(url);
    const encodedTitle = encodeURIComponent(title);
    const encodedDescription = encodeURIComponent(description || title);
    const encodedHashtags = hashtags.join(",");

    const shareLinks = {
        facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
        twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}${
            encodedHashtags ? `&hashtags=${encodedHashtags}` : ""
        }`,
        linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
        email: `mailto:?subject=${encodedTitle}&body=${encodedDescription}%0A%0A${encodedUrl}`,
    };

    const handleShare = (platform: keyof typeof shareLinks) => {
        const link = shareLinks[platform];
        if (platform === "email") {
            window.location.href = link;
        } else {
            window.open(link, "_blank", "width=600,height=400");
        }
    };

    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            toast.success("Link copied to clipboard!");
            setTimeout(() => setCopied(false), 2000);
        } catch (error) {
            toast.error("Failed to copy link");
        }
    };

    const handleNativeShare = async () => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title,
                    text: description,
                    url,
                });
            } catch (error) {
                // User cancelled share
                console.log("Share cancelled");
            }
        }
    };

    return (
        <div className={`flex items-center gap-2 ${className}`}>
            {/* Desktop - Individual buttons */}
            <div className="hidden md:flex gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("facebook")}
                    className="gap-2"
                >
                    <Facebook className="w-4 h-4" />
                    Share
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("twitter")}
                    className="gap-2"
                >
                    <Twitter className="w-4 h-4" />
                    Tweet
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleShare("linkedin")}
                    className="gap-2"
                >
                    <Linkedin className="w-4 h-4" />
                    Share
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopyLink}
                    className="gap-2"
                >
                    {copied ? (
                        <>
                            <Check className="w-4 h-4 text-green-600" />
                            Copied!
                        </>
                    ) : (
                        <>
                            <Copy className="w-4 h-4" />
                            Copy
                        </>
                    )}
                </Button>
            </div>

            {/* Mobile - Dropdown menu or native share */}
            <div className="md:hidden">
                {navigator.share ? (
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNativeShare}
                        className="gap-2"
                    >
                        <Share2 className="w-4 h-4" />
                        Share
                    </Button>
                ) : (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2"
                            >
                                <Share2 className="w-4 h-4" />
                                Share
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => handleShare("facebook")}
                            >
                                <Facebook className="w-4 h-4 mr-2" />
                                Facebook
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleShare("twitter")}
                            >
                                <Twitter className="w-4 h-4 mr-2" />
                                Twitter
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleShare("linkedin")}
                            >
                                <Linkedin className="w-4 h-4 mr-2" />
                                LinkedIn
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                onClick={() => handleShare("email")}
                            >
                                <Mail className="w-4 h-4 mr-2" />
                                Email
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={handleCopyLink}>
                                {copied ? (
                                    <Check className="w-4 h-4 mr-2 text-green-600" />
                                ) : (
                                    <Copy className="w-4 h-4 mr-2" />
                                )}
                                {copied ? "Copied!" : "Copy Link"}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )}
            </div>
        </div>
    );
}
