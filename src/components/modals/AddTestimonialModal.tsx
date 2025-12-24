import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Star, Upload, X } from "lucide-react";

const testimonialSchema = z.object({
  clientName: z.string().min(2, "Client name must be at least 2 characters"),
  rating: z.number().min(1, "Rating is required").max(5, "Rating must be between 1 and 5"),
  review: z.string().min(10, "Review must be at least 10 characters").max(500, "Review must be less than 500 characters"),
  propertyType: z.string().min(1, "Property type is required"),
  clientPhoto: z.instanceof(File).optional(),
  featured: z.boolean(),
});

export type TestimonialFormData = z.infer<typeof testimonialSchema>;

interface AddTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: TestimonialFormData) => void;
}

export function AddTestimonialModal({
  open,
  onOpenChange,
  onSave,
}: AddTestimonialModalProps) {
  const [error, setError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
    watch,
  } = useForm<TestimonialFormData>({
    resolver: zodResolver(testimonialSchema),
    defaultValues: {
      clientName: "",
      rating: 5,
      review: "",
      propertyType: "",
      featured: false,
    },
  });

  const rating = watch("rating");
  const review = watch("review");
  const featured = watch("featured");

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setValue("clientPhoto", file);

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setValue("clientPhoto", undefined);
    setPhotoPreview(null);
  };

  const onSubmit = async (data: TestimonialFormData) => {
    try {
      setError(null);
      await onSave?.(data);
      onOpenChange(false);
      reset();
      setPhotoPreview(null);
    } catch (err) {
      console.error("Failed to add testimonial:", err);
      setError("Failed to add testimonial. Please try again.");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Add Client Testimonial</DialogTitle>
          <DialogDescription>
            Share feedback from satisfied clients to build credibility
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                {...register("clientName")}
                placeholder="John Smith"
              />
              {errors.clientName && (
                <p className="text-sm text-red-600 mt-1">{errors.clientName.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                You can use initials for privacy (e.g., "John S.")
              </p>
            </div>

            <div>
              <Label htmlFor="propertyType">Property Type *</Label>
              <Input
                id="propertyType"
                {...register("propertyType")}
                placeholder="Single Family Home, Condo, etc."
              />
              {errors.propertyType && (
                <p className="text-sm text-red-600 mt-1">{errors.propertyType.message}</p>
              )}
            </div>
          </div>

          {/* Rating */}
          <div>
            <Label>Rating *</Label>
            <div className="flex gap-2 mt-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setValue("rating", star)}
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
            {errors.rating && (
              <p className="text-sm text-red-600 mt-1">{errors.rating.message}</p>
            )}
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review">Testimonial Text *</Label>
            <Textarea
              id="review"
              {...register("review")}
              rows={6}
              maxLength={500}
              placeholder="Share what the client said about working with you..."
            />
            {errors.review && (
              <p className="text-sm text-red-600 mt-1">{errors.review.message}</p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {review?.length || 0}/500 characters
            </p>
          </div>

          {/* Client Photo */}
          <div className="space-y-3">
            <Label>Client Photo (Optional)</Label>
            {!photoPreview ? (
              <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-accent/50 transition-colors cursor-pointer">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoUpload}
                  className="hidden"
                  id="photo-upload"
                />
                <label htmlFor="photo-upload" className="cursor-pointer">
                  <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">
                    Upload client photo
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    PNG, JPG up to 2MB
                  </p>
                </label>
              </div>
            ) : (
              <div className="relative inline-block">
                <img
                  src={photoPreview}
                  alt="Client preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
                <button
                  type="button"
                  onClick={removePhoto}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            )}
          </div>

          {/* Featured Toggle */}
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="featured"
              checked={featured}
              onChange={(e) => setValue("featured", e.target.checked)}
              className="rounded border-border"
            />
            <Label htmlFor="featured" className="cursor-pointer">
              Feature this testimonial on my profile
            </Label>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit">Add Testimonial</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
