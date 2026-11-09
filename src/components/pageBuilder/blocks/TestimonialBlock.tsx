/**
 * Testimonial Block Component
 * Displays client testimonials with ratings and avatars.
 *
 * With `source: 'profile'` it shows the agent's published testimonials from
 * the testimonials table — what every template uses, so no template carries
 * review text (US-305). Typed entries that a template or the settings panel's
 * "Add" button invented are never shown.
 */

import { useState } from 'react';
import { Testimonial, TestimonialBlockConfig } from '@/types/pageBuilder';
import { Star, ChevronLeft, ChevronRight, Quote, MessageSquare } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAgentPageFacts } from '@/hooks/useAgentPageFacts';
import { shownManualTestimonials } from '@/lib/agentPageFacts';

interface TestimonialBlockProps {
  config: TestimonialBlockConfig;
  isEditing?: boolean;
  userId?: string;
}

export function TestimonialBlock({ config, isEditing = false, userId }: TestimonialBlockProps) {
  const [slide, setSlide] = useState(0);
  const fromProfile = config.source === 'profile';
  const factsQuery = useAgentPageFacts(userId, fromProfile);
  const manual = shownManualTestimonials(fromProfile ? [] : config.testimonials);
  const testimonials: Testimonial[] = fromProfile
    ? (factsQuery.data?.testimonials ?? [])
    : manual.shown;
  const count = testimonials.length;
  const currentSlide = count > 0 ? slide % count : 0;

  const nextSlide = () => {
    setSlide((currentSlide + 1) % count);
  };

  const prevSlide = () => {
    setSlide((currentSlide - 1 + count) % count);
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5" role="img" aria-label={`${rating} out of 5 stars`}>
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            aria-hidden="true"
            className={`w-4 h-4 ${
              star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  if (fromProfile && factsQuery.isLoading) return null;

  if (count === 0) {
    // Visitors see nothing rather than an empty "Testimonials" box.
    if (!isEditing) return null;
    return (
      <div className="text-center py-12">
        <MessageSquare className="w-10 h-10 mx-auto mb-2 text-gray-300" />
        <p className="text-gray-500 font-medium">Testimonials</p>
        <p className="text-sm text-gray-500 mt-1 max-w-md mx-auto">
          {fromProfile
            ? 'Your published testimonials appear here. Add or publish them on the Testimonials page; until then this section is hidden on your page.'
            : 'Add testimonials in the settings panel'}
        </p>
        {manual.hiddenFabricated > 0 && (
          <p className="text-sm text-gray-500 mt-2 max-w-md mx-auto">
            {manual.hiddenFabricated === 1
              ? '1 example review from a template is hidden — it was not from a real client.'
              : `${manual.hiddenFabricated} example reviews from a template are hidden — they were not from real clients.`}
          </p>
        )}
      </div>
    );
  }

  const renderTestimonialCard = (testimonial: Testimonial, index: number) => (
    <div key={testimonial.id || index} className="relative p-6 rounded-xl border bg-white/80">
      {/* Quote icon */}
      <Quote
        aria-hidden="true"
        className="w-8 h-8 mb-3 opacity-15"
        style={{ color: 'var(--theme-primary, #2563eb)' }}
      />

      {/* Rating */}
      {testimonial.rating ? <div className="mb-3">{renderStars(testimonial.rating)}</div> : null}

      {/* Content */}
      <p className="text-gray-700 leading-relaxed italic mb-4">"{testimonial.content}"</p>

      {/* Author */}
      <div className="flex items-center gap-3 pt-3 border-t">
        <Avatar className="w-10 h-10">
          {testimonial.avatarUrl && (
            <AvatarImage src={testimonial.avatarUrl} alt={testimonial.name} />
          )}
          <AvatarFallback
            className="text-sm font-semibold text-white"
            style={{ backgroundColor: 'var(--theme-primary, #2563eb)' }}
          >
            {testimonial.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-semibold text-sm">{testimonial.name}</p>
          {testimonial.role && <p className="text-xs text-gray-500">{testimonial.role}</p>}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {config.title && (
        <h3
          className="text-2xl font-bold text-center"
          style={{ fontFamily: 'var(--theme-font-heading, inherit)' }}
        >
          {config.title}
        </h3>
      )}

      {/* Slider layout */}
      {config.layout === 'slider' && (
        <div className="relative">
          <div className="overflow-hidden">
            <div className="max-w-lg mx-auto">
              {renderTestimonialCard(testimonials[currentSlide], currentSlide)}
            </div>
          </div>

          {count > 1 && (
            <>
              <button
                type="button"
                onClick={prevSlide}
                disabled={isEditing}
                aria-label="Previous testimonial"
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={nextSlide}
                disabled={isEditing}
                aria-label="Next testimonial"
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-2 p-2 rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
              >
                <ChevronRight className="w-5 h-5" aria-hidden="true" />
              </button>

              {/* Dots */}
              <div className="flex justify-center gap-2 mt-4">
                {testimonials.map((t, index) => (
                  <button
                    type="button"
                    key={t.id || index}
                    onClick={() => !isEditing && setSlide(index)}
                    aria-label={`Show testimonial ${index + 1} of ${count}`}
                    aria-current={index === currentSlide ? 'true' : undefined}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentSlide ? 'w-6 bg-gray-800' : 'bg-gray-300 hover:bg-gray-400'
                    }`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      )}

      {/* Grid layout */}
      {config.layout === 'grid' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {testimonials.map((testimonial, index) => renderTestimonialCard(testimonial, index))}
        </div>
      )}

      {/* Stacked layout */}
      {config.layout === 'stacked' && (
        <div className="space-y-4 max-w-lg mx-auto">
          {testimonials.map((testimonial, index) => renderTestimonialCard(testimonial, index))}
        </div>
      )}
    </div>
  );
}
