/**
 * QuickNav Component
 * Floating navigation menu for public profile pages
 * Helps visitors quickly jump to different sections
 */

import { useState } from "react";
import { Home, Star, MessageCircle, User, Menu, X, ChevronUp } from "lucide-react";

interface QuickNavProps {
    hasListings?: boolean;
    hasTestimonials?: boolean;
}

export function QuickNav({ hasListings = true, hasTestimonials = true }: QuickNavProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [showScrollTop, setShowScrollTop] = useState(false);

    // Show scroll-to-top button after scrolling down
    if (typeof window !== 'undefined') {
        window.addEventListener('scroll', () => {
            setShowScrollTop(window.scrollY > 300);
        });
    }

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const navigateTo = (sectionId: string) => {
        const element = document.getElementById(sectionId);
        if (element) {
            const offset = 80; // Account for fixed headers
            const elementPosition = element.getBoundingClientRect().top;
            const offsetPosition = elementPosition + window.pageYOffset - offset;

            window.scrollTo({
                top: offsetPosition,
                behavior: 'smooth'
            });
        }
        setIsOpen(false);
    };

    return (
        <>
            {/* Quick Nav Button - Mobile Only */}
            <div className="md:hidden fixed top-4 right-4 z-30">
                <button
                    onClick={() => setIsOpen(!isOpen)}
                    className="bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                    aria-label={isOpen ? "Close navigation menu" : "Open navigation menu"}
                    aria-expanded={isOpen}
                >
                    {isOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>

                {/* Navigation Menu */}
                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 bg-black/30 -z-10"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />
                        <nav className="absolute top-14 right-0 bg-white rounded-lg shadow-xl p-2 space-y-1 min-w-[180px] border border-gray-200">
                            <button
                                onClick={() => navigateTo('about')}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                            >
                                <User className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium">About</span>
                            </button>

                            {hasListings && (
                                <button
                                    onClick={() => navigateTo('listings')}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                                >
                                    <Home className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium">Listings</span>
                                </button>
                            )}

                            <button
                                onClick={() => navigateTo('contact')}
                                className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                            >
                                <MessageCircle className="w-4 h-4 text-gray-600" />
                                <span className="text-sm font-medium">Contact</span>
                            </button>

                            {hasTestimonials && (
                                <button
                                    onClick={() => navigateTo('testimonials')}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-gray-100 transition-colors w-full text-left"
                                >
                                    <Star className="w-4 h-4 text-gray-600" />
                                    <span className="text-sm font-medium">Testimonials</span>
                                </button>
                            )}
                        </nav>
                    </>
                )}
            </div>

            {/* Scroll to Top Button */}
            {showScrollTop && (
                <button
                    onClick={scrollToTop}
                    className="fixed bottom-20 left-4 z-30 bg-white rounded-full p-3 shadow-lg border border-gray-200 hover:bg-gray-50 transition-all"
                    aria-label="Scroll to top"
                >
                    <ChevronUp className="w-5 h-5" />
                </button>
            )}
        </>
    );
}
