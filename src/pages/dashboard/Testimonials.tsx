import { Plus, Star, Edit, Trash2, Quote } from "lucide-react";

export default function Testimonials() {
  // Mock data
  const testimonials = [
    {
      id: 1,
      clientName: "Jennifer Wilson",
      rating: 5,
      review:
        "Working with this agent was an absolute pleasure! They helped us find our dream home within our budget and made the entire process stress-free. Highly recommend!",
      propertyType: "Single Family Home",
      date: "2024-01-15",
      featured: true,
      avatar: "https://ui-avatars.com/api/?name=Jennifer+Wilson&background=3b82f6&color=fff",
    },
    {
      id: 2,
      clientName: "Michael Chen",
      rating: 5,
      review:
        "Exceptional service from start to finish. The agent's market knowledge and negotiation skills got us an amazing deal. We couldn't be happier with our new investment property.",
      propertyType: "Investment Property",
      date: "2024-01-10",
      featured: false,
      avatar: "https://ui-avatars.com/api/?name=Michael+Chen&background=8b5cf6&color=fff",
    },
    {
      id: 3,
      clientName: "Sarah Martinez",
      rating: 5,
      review:
        "Sold our home in just 2 weeks! The marketing strategy was top-notch and the communication throughout was excellent. Truly a 5-star experience.",
      propertyType: "Condo",
      date: "2023-12-20",
      featured: true,
      avatar: "https://ui-avatars.com/api/?name=Sarah+Martinez&background=ec4899&color=fff",
    },
  ];

  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-1">
        {[...Array(5)].map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${
              i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Testimonials</h1>
          <p className="text-muted-foreground mt-1">
            Showcase client reviews and success stories
          </p>
        </div>
        <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
          <Plus className="h-4 w-4" />
          Add Testimonial
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-foreground">
            {testimonials.length}
          </div>
          <div className="text-sm text-muted-foreground">Total Reviews</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="flex items-center gap-2">
            <div className="text-2xl font-bold text-foreground">5.0</div>
            <div className="flex">
              {renderStars(5)}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {testimonials.filter((t) => t.featured).length}
          </div>
          <div className="text-sm text-muted-foreground">Featured</div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow relative"
          >
            {/* Featured Badge */}
            {testimonial.featured && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-yellow-100 text-yellow-700 text-xs rounded-full font-medium">
                  ⭐ Featured
                </span>
              </div>
            )}

            {/* Quote Icon */}
            <div className="mb-4">
              <Quote className="h-8 w-8 text-primary opacity-20" />
            </div>

            {/* Review */}
            <p className="text-foreground mb-6 leading-relaxed">
              "{testimonial.review}"
            </p>

            {/* Rating */}
            <div className="mb-4">{renderStars(testimonial.rating)}</div>

            {/* Client Info */}
            <div className="flex items-center justify-between pt-4 border-t border-border">
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.clientName}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-medium text-foreground">
                    {testimonial.clientName}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.propertyType}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button className="p-2 hover:bg-accent rounded-lg transition-colors">
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button className="p-2 hover:bg-red-50 rounded-lg transition-colors">
                  <Trash2 className="h-4 w-4 text-red-500" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {testimonials.length === 0 && (
        <div className="text-center py-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-accent rounded-full mb-4">
            <Star className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-2">
            No testimonials yet
          </h3>
          <p className="text-muted-foreground mb-6">
            Start building social proof by adding client reviews
          </p>
          <button className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium">
            <Plus className="h-5 w-5" />
            Add Your First Testimonial
          </button>
        </div>
      )}

      {/* Help Text */}
      <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
        <p className="text-sm text-blue-800 dark:text-blue-200">
          💡 <strong>Tip:</strong> Featured testimonials will be prominently
          displayed on your public profile. Ask satisfied clients for reviews
          after successful transactions!
        </p>
      </div>
    </div>
  );
}
