import { useState } from "react";
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

interface AddTestimonialModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave?: (data: TestimonialFormData) => void;
}

export interface TestimonialFormData {
  clientName: string;
  rating: number;
  review: string;
  propertyType: string;
  clientPhoto?: File;
  featured: boolean;
}

export function AddTestimonialModal({
  open,
  onOpenChange,
  onSave,
}: AddTestimonialModalProps) {
  const [formData, setFormData] = useState<TestimonialFormData>({
    clientName: "",
    rating: 5,
    review: "",
    propertyType: "",
    featured: false,
  });

  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, clientPhoto: file }));

      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removePhoto = () => {
    setFormData((prev) => ({ ...prev, clientPhoto: undefined }));
    setPhotoPreview(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave?.(formData);
    onOpenChange(false);
    // Reset form
    setFormData({
      clientName: "",
      rating: 5,
      review: "",
      propertyType: "",
      featured: false,
    });
    setPhotoPreview(null);
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Client Information */}
          <div className="space-y-4">
            <div>
              <Label htmlFor="clientName">Client Name *</Label>
              <Input
                id="clientName"
                name="clientName"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="John Smith"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                You can use initials for privacy (e.g., "John S.")
              </p>
            </div>

            <div>
              <Label htmlFor="propertyType">Property Type *</Label>
              <Input
                id="propertyType"
                name="propertyType"
                value={formData.propertyType}
                onChange={handleChange}
                placeholder="Single Family Home, Condo, etc."
                required
              />
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
                  onClick={() =>
                    setFormData((prev) => ({ ...prev, rating: star }))
                  }
                  className="focus:outline-none"
                >
                  <Star
                    className={`h-8 w-8 transition-colors ${
                      star <= formData.rating
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Review Text */}
          <div>
            <Label htmlFor="review">Testimonial Text *</Label>
            <Textarea
              id="review"
              name="review"
              value={formData.review}
              onChange={handleChange}
              rows={6}
              maxLength={500}
              placeholder="Share what the client said about working with you..."
              required
            />
            <p className="text-xs text-muted-foreground mt-1">
              {formData.review.length}/500 characters
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
              checked={formData.featured}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, featured: e.target.checked }))
              }
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
