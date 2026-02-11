/**
 * Testimonial Block Component
 * Displays client testimonials with ratings and avatars
 */

import { useState } from "react";
import { TestimonialBlockConfig } from "@/types/pageBuilder";
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquare } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface TestimonialBlockProps {
    config: TestimonialBlockConfig;
    isEditing?: boolean;
    userId?: string;
}

export function TestimonialBlock({ config, isEditing = false }: TestimonialBlockProps) {
    const [currentSlide, setCurrentSlide] = useState(0);

    const nextSlide = () => {
        setCurrentSlide((prev) => (prev + 1) % config.testimonials.length);
    };

    const prevSlide = () => {
        setCurrentSlide((prev) =>
            (prev - 1 + config.testimonials.length) % config.testimonials.length
        );
    };

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        className={`w-4 h-4 ${
                            star <= rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-gray-300"
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (config.testimonials.length === 0) {
        return (
            <div className="text-center py-12">
                <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                <p className="text-gray-500 font-medium">Testimonials</p>
                {isEditing && (
                    <p className="text-sm text-gray-400 mt-1">Add testimonials in the settings panel</p>
                )}
            </div>
        );
    }

    const renderTestimonialCard = (testimonial: typeof config.testimonials[0], index: number) => (
        <div
            key={testimonial.id || index}
            className="relative p-6 rounded-xl border bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-md transition-all"
        >
            {/* Quote icon */}
            <Quote
                className="w-8 h-8 mb-3 opacity-15"
                style={{ color: "var(--theme-primary, #2563eb)" }}
            />

            {/* Rating */}
            {testimonial.rating && (
                <div className="mb-3">
                    {renderStars(testimonial.rating)}
                </div>
            )}

            {/* Content */}
            <p className="text-gray-700 leading-relaxed italic mb-4">
                "{testimonial.content}"
            </p>

            {/* Author */}
            <div className="flex items-center gap-3 pt-3 border-t">
                <Avatar className="w-10 h-10">
                    {testimonial.avatarUrl && (
                        <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
                    )}
                    <AvatarFallback
                        className="text-sm font-semibold text-white"
                        style={{ backgroundColor: "var(--theme-primary, #2563eb)" }}
                    >
                        {testimonial.name.charAt(0)}
                    </AvatarFallback>
                </Avatar>
                <div>
                    <p className="font-semibold text-sm">{testimonial.name}</p>
                    {testimonial.role && (
                        <p className="text-xs text-gray-500">{testimonial.role}</p>
                    )}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {config.title && (
                <h3
                    className="text-2xl font-bold text-center"
                    style={{ fontFamily: "var(--theme-font-heading, inherit)" }}
                >
                    {config.title}
                </h3>
            )}

            {/* Slider layout */}
            {config.layout === "slider" && (
                <div className="relative">
                    <div className="overflow-hidden">
                        <div className="max-w-lg mx-auto">
                            {renderTestimonialCard(config.testimonials[currentSlide], currentSlide)}
                        </div>
                    </div>

                    {config.testimonials.length > 1 && (
                        <>
                            <button
                                onClick={prevSlide}
                                disabled={isEditing}
                                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                            >
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <button
                                onClick={nextSlide}
                                disabled={isEditing}
                                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                            >
                                <ChevronRight className="w-5 h-5" />
                            </button>

                            {/* Dots */}
                            <div className="flex justify-center gap-2 mt-4">
                                {config.testimonials.map((_, index) => (
                                    <button
                                        key={index}
                                        onClick={() => !isEditing && setCurrentSlide(index)}
                                        className={`w-2 h-2 rounded-full transition-all ${
                                            index === currentSlide
                                                ? "w-6 bg-gray-800"
                                                : "bg-gray-300 hover:bg-gray-400"
                                        }`}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            )}

            {/* Grid layout */}
            {config.layout === "grid" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {config.testimonials.map((testimonial, index) =>
                        renderTestimonialCard(testimonial, index)
                    )}
                </div>
            )}

            {/* Stacked layout */}
            {config.layout === "stacked" && (
                <div className="space-y-4 max-w-lg mx-auto">
                    {config.testimonials.map((testimonial, index) =>
                        renderTestimonialCard(testimonial, index)
                    )}
                </div>
            )}
        </div>
    );
}
