import { useState } from "react";
import { ChevronLeft, ChevronRight, Star, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TestimonialCard } from "./TestimonialCard";
import type { Testimonial } from "@/types/testimonial";

interface TestimonialSectionProps {
    testimonials: Testimonial[];
}

export function TestimonialSection({ testimonials }: TestimonialSectionProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    if (!testimonials || testimonials.length === 0) {
        return null;
    }

    const sortedTestimonials = [...testimonials].sort((a, b) => {
        // Featured first, then by sort_order, then by date
        if (a.is_featured && !b.is_featured) return -1;
        if (!a.is_featured && b.is_featured) return 1;
        if (a.sort_order !== b.sort_order) return a.sort_order - b.sort_order;
        return new Date(b.date).getTime() - new Date(a.date).getTime();
    });

    const averageRating =
        testimonials.reduce((sum, t) => sum + t.rating, 0) /
        testimonials.length;

    const goToPrevious = () => {
        setCurrentIndex((prev) =>
            prev === 0 ? sortedTestimonials.length - 1 : prev - 1
        );
    };

    const goToNext = () => {
        setCurrentIndex((prev) =>
            prev === sortedTestimonials.length - 1 ? 0 : prev + 1
        );
    };

    // Show 3 testimonials at a time on desktop
    const visibleTestimonials = [
        sortedTestimonials[currentIndex],
        sortedTestimonials[(currentIndex + 1) % sortedTestimonials.length],
        sortedTestimonials[(currentIndex + 2) % sortedTestimonials.length],
    ].filter(Boolean);

    return (
        <section className="w-full max-w-6xl mx-auto px-4 py-12">
            {/* Header */}
            <div className="text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                    <MessageCircle className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl font-bold mb-3">What My Clients Say</h2>
                <div className="flex items-center justify-center gap-3 text-muted-foreground">
                    <div className="flex items-center gap-1">
                        <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                        <span className="text-lg font-semibold text-foreground">
                            {averageRating.toFixed(1)}
                        </span>
                    </div>
                    <span>•</span>
                    <span>{testimonials.length} reviews</span>
                </div>
            </div>

            {/* Desktop: Multiple cards with navigation */}
            <div className="hidden md:block">
                <div className="relative">
                    {/* Navigation Buttons */}
                    {sortedTestimonials.length > 3 && (
                        <>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 z-10 rounded-full bg-white shadow-lg"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 z-10 rounded-full bg-white shadow-lg"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </>
                    )}

                    {/* Cards Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {visibleTestimonials.map((testimonial) => (
                            <TestimonialCard
                                key={testimonial.id}
                                testimonial={testimonial}
                                variant="compact"
                            />
                        ))}
                    </div>
                </div>

                {/* Dots Indicator */}
                {sortedTestimonials.length > 3 && (
                    <div className="flex justify-center gap-2 mt-6">
                        {sortedTestimonials.map((_, index) => (
                            <button
                                key={index}
                                onClick={() => setCurrentIndex(index)}
                                className={`h-2 rounded-full transition-all ${
                                    index === currentIndex
                                        ? "w-8 bg-primary"
                                        : "w-2 bg-gray-300 hover:bg-gray-400"
                                }`}
                                aria-label={`Go to testimonial ${index + 1}`}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* Mobile: Single card with navigation */}
            <div className="md:hidden">
                <div className="relative">
                    <TestimonialCard
                        testimonial={sortedTestimonials[currentIndex]}
                        variant="default"
                    />

                    {/* Navigation Buttons */}
                    {sortedTestimonials.length > 1 && (
                        <div className="flex justify-center gap-4 mt-6">
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToPrevious}
                            >
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={goToNext}
                            >
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    )}

                    {/* Dots Indicator */}
                    {sortedTestimonials.length > 1 && (
                        <div className="flex justify-center gap-2 mt-4">
                            {sortedTestimonials.map((_, index) => (
                                <button
                                    key={index}
                                    onClick={() => setCurrentIndex(index)}
                                    className={`h-2 rounded-full transition-all ${
                                        index === currentIndex
                                            ? "w-8 bg-primary"
                                            : "w-2 bg-gray-300"
                                    }`}
                                    aria-label={`Go to testimonial ${
                                        index + 1
                                    }`}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </section>
    );
}
