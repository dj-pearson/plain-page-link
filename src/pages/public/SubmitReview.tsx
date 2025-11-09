import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, Send, CheckCircle, Home } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import LoadingSpinner from "@/components/ui/LoadingSpinner";

export default function SubmitReview() {
  const { username } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [formData, setFormData] = useState({
    client_name: "",
    client_email: "",
    client_title: "",
    review: "",
    property_type: "",
    transaction_type: "buyer",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, bio")
          .eq("username", username)
          .single();

        if (error) throw error;
        setProfile(data);
      } catch (error) {
        console.error("Error fetching profile:", error);
        toast({
          title: "Agent not found",
          description: "The agent profile could not be found.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    if (username) {
      fetchProfile();
    }
  }, [username, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating.",
        variant: "destructive",
      });
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase
        .from("testimonials")
        .insert({
          user_id: profile.id,
          client_name: formData.client_name,
          client_title: formData.client_title || "",
          rating: rating,
          review: formData.review,
          property_type: formData.property_type || "",
          transaction_type: formData.transaction_type,
          date: new Date().toISOString(),
        });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Review submitted!",
        description: `Thank you for sharing your experience with ${profile.full_name}!`,
      });
    } catch (error) {
      console.error("Error submitting review:", error);
      toast({
        title: "Submission failed",
        description: "There was an error submitting your review. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl">Agent Not Found</CardTitle>
            <CardDescription>
              The agent profile you're looking for doesn't exist.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate("/")}
              className="w-full"
            >
              <Home className="mr-2 h-4 w-4" />
              Go to Homepage
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-green-600" />
              </div>
            </div>
            <CardTitle className="text-2xl">Thank You!</CardTitle>
            <CardDescription className="text-base mt-2">
              Your review has been submitted successfully. {profile.full_name} will be
              notified and may feature your testimonial on their profile.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => navigate(`/${username}`)}
              className="w-full"
              variant="outline"
            >
              View {profile.full_name}'s Profile
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-4 mb-4">
              {profile.avatar_url && (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name}
                  className="w-16 h-16 rounded-full object-cover"
                />
              )}
              <div>
                <CardTitle className="text-2xl">Share Your Experience</CardTitle>
                <CardDescription className="text-base">
                  Leave a review for {profile.full_name}
                </CardDescription>
              </div>
            </div>
            {profile.bio && (
              <p className="text-sm text-muted-foreground italic">
                "{profile.bio}"
              </p>
            )}
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Rating */}
              <div>
                <Label className="text-base font-semibold mb-3 block">
                  How would you rate your experience? *
                </Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setRating(star)}
                      onMouseEnter={() => setHoveredRating(star)}
                      onMouseLeave={() => setHoveredRating(0)}
                      className="transition-transform hover:scale-110"
                    >
                      <Star
                        className={`w-10 h-10 ${
                          star <= (hoveredRating || rating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-gray-300"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {rating > 0 && (
                    <span className="text-blue-600 font-medium">
                      {rating === 5 ? "Excellent!" : rating === 4 ? "Great!" : rating === 3 ? "Good" : rating === 2 ? "Fair" : "Poor"}
                    </span>
                  )}
                </p>
              </div>

              {/* Name */}
              <div>
                <Label htmlFor="client_name">Your Name *</Label>
                <Input
                  id="client_name"
                  value={formData.client_name}
                  onChange={(e) =>
                    setFormData({ ...formData, client_name: e.target.value })
                  }
                  placeholder="John Doe"
                  required
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="client_email">Your Email *</Label>
                <Input
                  id="client_email"
                  type="email"
                  value={formData.client_email}
                  onChange={(e) =>
                    setFormData({ ...formData, client_email: e.target.value })
                  }
                  placeholder="john@example.com"
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your email won't be published, it's for verification only.
                </p>
              </div>

              {/* Title/Occupation (optional) */}
              <div>
                <Label htmlFor="client_title">Title/Occupation (Optional)</Label>
                <Input
                  id="client_title"
                  value={formData.client_title}
                  onChange={(e) =>
                    setFormData({ ...formData, client_title: e.target.value })
                  }
                  placeholder="e.g., First-time Homebuyer, Real Estate Investor"
                />
              </div>

              {/* Transaction Type */}
              <div>
                <Label htmlFor="transaction_type">Transaction Type</Label>
                <select
                  id="transaction_type"
                  value={formData.transaction_type}
                  onChange={(e) =>
                    setFormData({ ...formData, transaction_type: e.target.value })
                  }
                  className="w-full px-3 py-2 border border-input bg-background rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="both">Both (Buyer & Seller)</option>
                </select>
              </div>

              {/* Property Type (optional) */}
              <div>
                <Label htmlFor="property_type">Property Type (Optional)</Label>
                <Input
                  id="property_type"
                  value={formData.property_type}
                  onChange={(e) =>
                    setFormData({ ...formData, property_type: e.target.value })
                  }
                  placeholder="e.g., Single Family Home, Condo, Townhouse"
                />
              </div>

              {/* Review */}
              <div>
                <Label htmlFor="review">Your Review *</Label>
                <Textarea
                  id="review"
                  value={formData.review}
                  onChange={(e) =>
                    setFormData({ ...formData, review: e.target.value })
                  }
                  placeholder="Share your experience working with this agent..."
                  rows={6}
                  required
                  className="resize-none"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Please be specific about what made your experience positive.
                </p>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                disabled={submitting || rating === 0}
                className="w-full"
                size="lg"
              >
                {submitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Submitting...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Submit Review
                  </>
                )}
              </Button>

              <p className="text-xs text-center text-muted-foreground">
                By submitting this review, you agree that it may be displayed publicly
                on {profile.full_name}'s profile page.
              </p>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
