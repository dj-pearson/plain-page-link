/**
 * Public Page Viewer
 * Displays published link-in-bio pages to visitors
 */

import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { PageConfig } from "@/types/pageBuilder";
import { BlockRenderer } from "@/components/pageBuilder/BlockRenderer";
import { Helmet } from "react-helmet-async";
import { Loader2 } from "lucide-react";

export default function PublicPage() {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<PageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchPage = async () => {
            if (!slug) {
                setError("No page slug provided");
                setLoading(false);
                return;
            }

            try {
                // TODO: Implement actual API call
                // const response = await api.getPublicPage(slug);
                // setPage(response.data);

                // For now, try to load from localStorage
                const savedPages = Object.keys(localStorage)
                    .filter((key) => key.startsWith("page_"))
                    .map((key) => {
                        try {
                            return JSON.parse(localStorage.getItem(key) || "");
                        } catch {
                            return null;
                        }
                    })
                    .filter((p) => p !== null);

                const matchingPage = savedPages.find((p) => p.slug === slug);

                if (matchingPage && matchingPage.published) {
                    setPage(matchingPage);
                } else {
                    setError("Page not found or not published");
                }
            } catch (err) {
                console.error("Failed to fetch page:", err);
                setError("Failed to load page");
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-600">Loading page...</p>
                </div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-2">
                        404
                    </h1>
                    <p className="text-gray-600 mb-4">
                        {error || "Page not found"}
                    </p>
                    <a href="/" className="text-primary hover:underline">
                        Go to homepage
                    </a>
                </div>
            </div>
        );
    }

    // Apply theme styles
    const themeStyles = {
        "--primary-color": page.theme.colors.primary,
        "--secondary-color": page.theme.colors.secondary,
        "--background-color": page.theme.colors.background,
        "--text-color": page.theme.colors.text,
        "--accent-color": page.theme.colors.accent,
        "--border-radius":
            page.theme.borderRadius === "none"
                ? "0"
                : page.theme.borderRadius === "small"
                ? "0.25rem"
                : page.theme.borderRadius === "large"
                ? "1rem"
                : page.theme.borderRadius === "full"
                ? "9999px"
                : "0.5rem",
    } as React.CSSProperties;

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{page.seo.title || page.title}</title>
                <meta
                    name="description"
                    content={page.seo.description || page.description}
                />
                <meta name="keywords" content={page.seo.keywords.join(", ")} />

                {/* Open Graph */}
                <meta
                    property="og:title"
                    content={page.seo.title || page.title}
                />
                <meta
                    property="og:description"
                    content={page.seo.description || page.description}
                />
                <meta property="og:type" content="website" />
                {page.seo.ogImage && (
                    <meta property="og:image" content={page.seo.ogImage} />
                )}

                {/* Twitter Card */}
                <meta name="twitter:card" content={page.seo.twitterCard} />
                <meta
                    name="twitter:title"
                    content={page.seo.title || page.title}
                />
                <meta
                    name="twitter:description"
                    content={page.seo.description || page.description}
                />
                {page.seo.ogImage && (
                    <meta name="twitter:image" content={page.seo.ogImage} />
                )}

                {/* Structured Data */}
                {page.seo.structuredData && (
                    <script type="application/ld+json">
                        {JSON.stringify(page.seo.structuredData)}
                    </script>
                )}
            </Helmet>

            {/* Page Content */}
            <div
                style={themeStyles}
                className="min-h-screen"
                data-theme={page.theme.preset || "default"}
            >
                <div
                    className="max-w-4xl mx-auto py-12 px-4"
                    style={{
                        backgroundColor: page.theme.colors.background,
                        color: page.theme.colors.text,
                    }}
                >
                    {/* Render visible blocks */}
                    <div
                        className={`space-y-${
                            page.theme.spacing === "compact"
                                ? "4"
                                : page.theme.spacing === "spacious"
                                ? "12"
                                : "8"
                        }`}
                    >
                        {page.blocks
                            .filter((block) => block.visible)
                            .sort((a, b) => a.order - b.order)
                            .map((block) => (
                                <BlockRenderer
                                    key={block.id}
                                    block={block}
                                    isEditing={false}
                                />
                            ))}
                    </div>

                    {/* Footer */}
                    <div className="mt-16 pt-8 border-t text-center text-sm text-gray-500">
                        <p>
                            Powered by{" "}
                            <a
                                href="https://agentbio.net"
                                className="text-primary hover:underline"
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                AgentBio
                            </a>
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
