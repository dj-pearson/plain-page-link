/**
 * Public Page Viewer
 * Displays published link-in-bio pages to visitors
 * Features: entrance animations, polished rendering, floating contact CTA
 */

import { useEffect, useState, useRef } from "react";
import { useParams } from "react-router-dom";
import { PageConfig, BlockStyle } from "@/types/pageBuilder";
import { BlockRenderer } from "@/components/pageBuilder/BlockRenderer";
import { Helmet } from "react-helmet-async";
import { Loader2, MessageCircle, X } from "lucide-react";
import { getThemedStyles, preloadThemeFonts } from "@/lib/themeUtils";
import { motion, AnimatePresence } from "framer-motion";

const animationVariants: Record<string, any> = {
    fadeIn: {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        transition: { duration: 0.6 },
    },
    slideUp: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
    },
    slideLeft: {
        initial: { opacity: 0, x: -30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
    },
    slideRight: {
        initial: { opacity: 0, x: 30 },
        animate: { opacity: 1, x: 0 },
        transition: { duration: 0.5, ease: "easeOut" },
    },
    scaleIn: {
        initial: { opacity: 0, scale: 0.9 },
        animate: { opacity: 1, scale: 1 },
        transition: { duration: 0.5, ease: "easeOut" },
    },
    bounce: {
        initial: { opacity: 0, y: 30 },
        animate: { opacity: 1, y: 0 },
        transition: { type: "spring", stiffness: 300, damping: 20 },
    },
};

function AnimatedBlock({ block, children, index }: { block: any; children: React.ReactNode; index: number }) {
    const animation = (block.style as BlockStyle)?.animation;
    const variant = animation && animation !== "none" ? animationVariants[animation] : null;

    if (!variant) {
        return (
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: index * 0.08 }}
            >
                {children}
            </motion.div>
        );
    }

    return (
        <motion.div
            initial={variant.initial}
            whileInView={variant.animate}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ ...variant.transition, delay: index * 0.08 }}
        >
            {children}
        </motion.div>
    );
}

export default function PublicPage() {
    const { slug } = useParams<{ slug: string }>();
    const [page, setPage] = useState<PageConfig | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFloatingCta, setShowFloatingCta] = useState(false);

    useEffect(() => {
        const fetchPage = async () => {
            if (!slug) {
                setError("No page slug provided");
                setLoading(false);
                return;
            }

            try {
                const { supabase } = await import("@/integrations/supabase/client");

                const { data, error } = await supabase
                    .from('custom_pages')
                    .select('*')
                    .eq('slug', slug)
                    .eq('published', true)
                    .single();

                if (error) throw error;
                if (!data) {
                    setError("Page not found or not published");
                    setLoading(false);
                    return;
                }

                const pageConfig: PageConfig = {
                    id: data.id,
                    userId: data.user_id,
                    slug: data.slug,
                    title: data.title,
                    description: data.description || '',
                    blocks: data.blocks as any[],
                    theme: data.theme as any,
                    seo: data.seo as any,
                    published: data.published,
                    createdAt: new Date(data.created_at),
                    updatedAt: new Date(data.updated_at),
                };

                setPage(pageConfig);
            } catch (err) {
                console.error("Failed to fetch page:", err);
                setError("Page not found or not published");
            } finally {
                setLoading(false);
            }
        };

        fetchPage();
    }, [slug]);

    // Preload theme fonts when page loads
    useEffect(() => {
        if (page?.theme) {
            preloadThemeFonts(page.theme);
        }
    }, [page?.theme]);

    // Show floating CTA after scrolling
    useEffect(() => {
        if (!page) return;
        const hasContact = page.blocks.some((b) => b.type === "contact" && b.visible);
        if (!hasContact) return;

        const handleScroll = () => {
            setShowFloatingCta(window.scrollY > 400);
        };
        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [page]);

    const scrollToContact = () => {
        const contactEl = document.querySelector('[data-block-type="contact"]');
        if (contactEl) {
            contactEl.scrollIntoView({ behavior: "smooth", block: "center" });
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center"
                >
                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
                    <p className="text-gray-500">Loading...</p>
                </motion.div>
            </div>
        );
    }

    if (error || !page) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-gray-50">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                >
                    <h1 className="text-6xl font-bold text-gray-200 mb-2">404</h1>
                    <p className="text-gray-600 mb-4">{error || "Page not found"}</p>
                    <a
                        href="/"
                        className="text-primary hover:underline font-medium"
                    >
                        Go to homepage
                    </a>
                </motion.div>
            </div>
        );
    }

    const themeStyles = getThemedStyles(page.theme);
    const visibleBlocks = page.blocks
        .filter((block) => block.visible)
        .sort((a, b) => a.order - b.order);
    const hasContactBlock = visibleBlocks.some((b) => b.type === "contact");

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{page.seo?.title || page.title}</title>
                <meta
                    name="description"
                    content={page.seo?.description || page.description}
                />
                {page.seo?.keywords && (
                    <meta name="keywords" content={page.seo.keywords.join(", ")} />
                )}

                {/* Open Graph */}
                <meta property="og:title" content={page.seo?.title || page.title} />
                <meta property="og:description" content={page.seo?.description || page.description} />
                <meta property="og:type" content="website" />
                {page.seo?.ogImage && <meta property="og:image" content={page.seo.ogImage} />}

                {/* Twitter Card */}
                <meta name="twitter:card" content={page.seo?.twitterCard || "summary_large_image"} />
                <meta name="twitter:title" content={page.seo?.title || page.title} />
                <meta name="twitter:description" content={page.seo?.description || page.description} />
                {page.seo?.ogImage && <meta name="twitter:image" content={page.seo.ogImage} />}

                {/* Structured Data */}
                {page.seo?.structuredData && (
                    <script type="application/ld+json">
                        {JSON.stringify(page.seo.structuredData)}
                    </script>
                )}
            </Helmet>

            {/* Page Content */}
            <div
                style={{
                    ...themeStyles,
                    backgroundColor: page.theme.colors.background,
                    color: page.theme.colors.text,
                    fontFamily: `'${page.theme.fonts.body}', sans-serif`,
                }}
                className="min-h-screen"
                data-theme={page.theme.preset || "default"}
            >
                <div className="max-w-3xl mx-auto py-8 md:py-12 px-4">
                    {/* Render visible blocks with animations */}
                    <div
                        style={{
                            display: "flex",
                            flexDirection: "column",
                            gap: page.theme.spacing === "compact" ? "1rem" :
                                 page.theme.spacing === "spacious" ? "3rem" : "2rem",
                        }}
                    >
                        {visibleBlocks.map((block, index) => (
                            <div key={block.id} data-block-type={block.type}>
                                <AnimatedBlock block={block} index={index}>
                                    <BlockRenderer
                                        block={block}
                                        isEditing={false}
                                        userId={page.userId}
                                    />
                                </AnimatedBlock>
                            </div>
                        ))}
                    </div>

                    {/* Footer */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1 }}
                        className="mt-16 pt-8 border-t text-center text-sm opacity-50"
                        style={{ borderColor: `${page.theme.colors.text}20` }}
                    >
                        <p>
                            Powered by{" "}
                            <a
                                href="https://agentbio.net"
                                className="hover:underline font-medium"
                                style={{ color: page.theme.colors.primary }}
                                target="_blank"
                                rel="noopener noreferrer"
                            >
                                AgentBio
                            </a>
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Floating Contact CTA */}
            <AnimatePresence>
                {hasContactBlock && showFloatingCta && (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.8, y: 20 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={scrollToContact}
                        className="fixed bottom-6 right-6 z-50 flex items-center gap-2 px-5 py-3 rounded-full shadow-lg text-white font-medium text-sm"
                        style={{
                            backgroundColor: page.theme.colors.primary,
                        }}
                    >
                        <MessageCircle className="w-4 h-4" />
                        Get in Touch
                    </motion.button>
                )}
            </AnimatePresence>
        </>
    );
}
