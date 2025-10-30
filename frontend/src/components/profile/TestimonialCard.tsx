import { Star, Quote } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import type { Testimonial } from "@/types/testimonial";
import { formatRelativeTime } from "@/lib/format";

interface TestimonialCardProps {
    testimonial: Testimonial;
    variant?: "default" | "compact";
}

export function TestimonialCard({
    testimonial,
    variant = "default",
}: TestimonialCardProps) {
    const initials = testimonial.client_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);

    const renderStars = () => {
        return (
            <div className="flex gap-1">
                {[...Array(5)].map((_, i) => (
                    <Star
                        key={i}
                        className={`w-4 h-4 ${
                            i < testimonial.rating
                                ? "text-yellow-400 fill-yellow-400"
                                : "text-gray-300 fill-gray-300"
                        }`}
                    />
                ))}
            </div>
        );
    };

    if (variant === "compact") {
        return (
            <Card className="h-full">
                <CardContent className="p-5">
                    <div className="flex items-start gap-3">
                        <Quote className="w-8 h-8 text-primary/20 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                            {renderStars()}
                            <p className="text-sm text-muted-foreground mt-3 line-clamp-4">
                                "{testimonial.review_text}"
                            </p>
                            <div className="mt-4 flex items-center gap-2">
                                <Avatar className="w-8 h-8">
                                    <AvatarImage
                                        src={
                                            testimonial.client_photo ||
                                            undefined
                                        }
                                    />
                                    <AvatarFallback className="text-xs">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <div className="min-w-0">
                                    <p className="font-medium text-sm truncate">
                                        {testimonial.client_name}
                                    </p>
                                    {testimonial.client_title && (
                                        <p className="text-xs text-muted-foreground truncate">
                                            {testimonial.client_title}
                                        </p>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="h-full hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
                {/* Quote Icon */}
                <div className="mb-4">
                    <Quote className="w-10 h-10 text-primary/20" />
                </div>

                {/* Rating */}
                <div className="mb-3">{renderStars()}</div>

                {/* Review Text */}
                <p className="text-muted-foreground mb-6 leading-relaxed">
                    "{testimonial.review_text}"
                </p>

                {/* Client Info */}
                <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12">
                        <AvatarImage
                            src={testimonial.client_photo || undefined}
                            alt={testimonial.client_name}
                        />
                        <AvatarFallback>{initials}</AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                        <p className="font-semibold">
                            {testimonial.client_name}
                        </p>
                        {testimonial.client_title && (
                            <p className="text-sm text-muted-foreground">
                                {testimonial.client_title}
                            </p>
                        )}

                        {/* Badges */}
                        <div className="flex gap-2 mt-2 flex-wrap">
                            {testimonial.transaction_type && (
                                <Badge variant="secondary" className="text-xs">
                                    {testimonial.transaction_type === "buyer"
                                        ? "Buyer"
                                        : "Seller"}
                                </Badge>
                            )}
                            {testimonial.property_type && (
                                <Badge variant="outline" className="text-xs">
                                    {testimonial.property_type}
                                </Badge>
                            )}
                        </div>

                        {/* Date */}
                        <p className="text-xs text-muted-foreground mt-2">
                            {formatRelativeTime(testimonial.date)}
                        </p>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
