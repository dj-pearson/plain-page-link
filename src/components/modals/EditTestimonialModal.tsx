import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export interface EditTestimonialFormData {
  client_name: string;
  review: string;
  rating: number;
  client_title?: string;
  property_type?: string;
  transaction_type?: string;
}

interface EditTestimonialModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditTestimonialFormData) => void;
  initialData: EditTestimonialFormData;
}

export function EditTestimonialModal({ isOpen, onClose, onSubmit, initialData }: EditTestimonialModalProps) {
  const [formData, setFormData] = useState<EditTestimonialFormData>(initialData);

  useEffect(() => {
    setFormData(initialData);
  }, [initialData]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-card border border-border rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-card border-b border-border p-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Edit Testimonial</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-accent rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <Label htmlFor="client_name">Client Name *</Label>
            <Input
              id="client_name"
              value={formData.client_name}
              onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
              required
            />
          </div>

          <div>
            <Label htmlFor="client_title">Client Title</Label>
            <Input
              id="client_title"
              value={formData.client_title || ''}
              onChange={(e) => setFormData({ ...formData, client_title: e.target.value })}
              placeholder="e.g., First-Time Homebuyer"
            />
          </div>

          <div>
            <Label htmlFor="rating">Rating *</Label>
            <Input
              id="rating"
              type="number"
              min="1"
              max="5"
              value={formData.rating}
              onChange={(e) => setFormData({ ...formData, rating: parseInt(e.target.value) })}
              required
            />
          </div>

          <div>
            <Label htmlFor="review">Review *</Label>
            <Textarea
              id="review"
              value={formData.review}
              onChange={(e) => setFormData({ ...formData, review: e.target.value })}
              rows={6}
              required
            />
          </div>

          <div>
            <Label htmlFor="property_type">Property Type</Label>
            <Input
              id="property_type"
              value={formData.property_type || ''}
              onChange={(e) => setFormData({ ...formData, property_type: e.target.value })}
              placeholder="e.g., Single Family Home"
            />
          </div>

          <div>
            <Label htmlFor="transaction_type">Transaction Type</Label>
            <select
              id="transaction_type"
              value={formData.transaction_type || ''}
              onChange={(e) => setFormData({ ...formData, transaction_type: e.target.value })}
              className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select type</option>
              <option value="buyer">Buyer</option>
              <option value="seller">Seller</option>
            </select>
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Cancel
            </Button>
            <Button type="submit" className="flex-1">
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
