import { useState } from "react";
import { Plus, Star, Edit, Trash2, Quote, Share2 } from "lucide-react";
import { AddTestimonialModal } from "@/components/modals/AddTestimonialModal";
import { EditTestimonialModal, EditTestimonialFormData } from "@/components/modals/EditTestimonialModal";
import type { TestimonialFormData } from "@/components/modals/AddTestimonialModal";
import { useToast } from "@/hooks/use-toast";
import { useTestimonials } from "@/hooks/useTestimonials";
import { supabase } from "@/integrations/supabase/client";
import { useSubscriptionLimits } from "@/hooks/useSubscriptionLimits";
import { UpgradeModal } from "@/components/UpgradeModal";
import { LimitBanner } from "@/components/LimitBanner";
import { RequestTestimonialModal } from "@/components/testimonials/RequestTestimonialModal";
import { useProfile } from "@/hooks/useProfile";

export default function Testimonials() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTestimonial, setEditingTestimonial] = useState<any>(null);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [showRequestModal, setShowRequestModal] = useState(false);
  const { toast } = useToast();
  const { testimonials, isLoading, addTestimonial, deleteTestimonial } = useTestimonials();
  const { subscription, canAdd, getLimit, getUsage } = useSubscriptionLimits();
  const { profile } = useProfile();

  const handleAddClick = () => {
    if (!canAdd('testimonials')) {
      setShowUpgradeModal(true);
      return;
    }
    setIsAddModalOpen(true);
  };

  const handleAddTestimonial = async (data: TestimonialFormData) => {
    try {
      await addTestimonial.mutateAsync(data);
      toast({
        title: "Testimonial added!",
        description: "Client review has been added successfully.",
      });
      setIsAddModalOpen(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add testimonial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTestimonial = async (id: string) => {
    if (!confirm("Are you sure you want to delete this testimonial?")) return;
    
    try {
      await deleteTestimonial.mutateAsync(id);
      toast({
        title: "Testimonial deleted",
        description: "Client review has been removed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete testimonial.",
        variant: "destructive",
      });
    }
  };

  const handleEditTestimonial = async (data: EditTestimonialFormData) => {
    if (!editingTestimonial) return;
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase
        .from('testimonials')
        .update({
          client_name: data.client_name,
          client_title: data.client_title,
          rating: data.rating,
          review: data.review,
          property_type: data.property_type,
          transaction_type: data.transaction_type,
          updated_at: new Date().toISOString()
        })
        .eq('id', editingTestimonial.id)
        .eq('user_id', user.id);

      if (error) throw error;
      
      toast({
        title: "Testimonial updated!",
        description: "Client review has been updated successfully.",
      });
      setEditingTestimonial(null);
      window.location.reload();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to update testimonial. Please try again.",
        variant: "destructive",
      });
    }
  };

  const averageRating = testimonials.length > 0
    ? (testimonials.reduce((sum, t) => sum + t.rating, 0) / testimonials.length).toFixed(1)
    : "0.0";

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
        <div className="flex gap-2">
          <button
            onClick={() => setShowRequestModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80 transition-colors font-medium border border-border"
          >
            <Share2 className="h-4 w-4" />
            Request Testimonial
          </button>
          <button
            onClick={handleAddClick}
            className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
          >
            <Plus className="h-4 w-4" />
            Add Testimonial
          </button>
        </div>
      </div>

      {/* Limit Banner */}
      {subscription && getLimit('testimonials') !== Infinity && (
        <LimitBanner
          feature="testimonials"
          current={getUsage('testimonials')}
          limit={getLimit('testimonials')}
        />
      )}

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
            <div className="text-2xl font-bold text-foreground">{averageRating}</div>
            <div className="flex">
              {renderStars(Math.round(parseFloat(averageRating)))}
            </div>
          </div>
          <div className="text-sm text-muted-foreground">Average Rating</div>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <div className="text-2xl font-bold text-primary">
            {testimonials.length}
          </div>
          <div className="text-sm text-muted-foreground">Total Reviews</div>
        </div>
      </div>

      {/* Testimonials Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {testimonials.map((testimonial) => (
          <div
            key={testimonial.id}
            className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow relative"
          >
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
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {testimonial.client_name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <div className="font-medium text-foreground">
                    {testimonial.client_name}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {testimonial.property_type || "Client"}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1">
                <button 
                  onClick={() => setEditingTestimonial(testimonial)}
                  className="p-2 hover:bg-accent rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4 text-muted-foreground" />
                </button>
                <button 
                  onClick={() => handleDeleteTestimonial(testimonial.id)}
                  className="p-2 hover:bg-red-50 rounded-lg transition-colors"
                >
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

      {/* Add Testimonial Modal */}
      <AddTestimonialModal
        open={isAddModalOpen}
        onOpenChange={setIsAddModalOpen}
        onSave={handleAddTestimonial}
      />

      {/* Edit Testimonial Modal */}
      {editingTestimonial && (
        <EditTestimonialModal
          isOpen={!!editingTestimonial}
          onClose={() => setEditingTestimonial(null)}
          onSubmit={handleEditTestimonial}
          initialData={{
            client_name: editingTestimonial.client_name,
            review: editingTestimonial.review,
            rating: editingTestimonial.rating,
            client_title: editingTestimonial.client_title,
            property_type: editingTestimonial.property_type,
            transaction_type: editingTestimonial.transaction_type,
          }}
        />
      )}

      {/* Upgrade Modal */}
      <UpgradeModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        feature="testimonials"
        currentPlan={subscription?.plan_name || "Free"}
        requiredPlan="Starter"
      />

      {/* Request Testimonial Modal */}
      {profile && (
        <RequestTestimonialModal
          open={showRequestModal}
          onOpenChange={setShowRequestModal}
          username={profile.username || ''}
          agentName={profile.full_name || ''}
        />
      )}
    </div>
  );
}
