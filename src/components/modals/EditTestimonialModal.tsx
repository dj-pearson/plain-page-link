import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

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

export function EditTestimonialModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
}: EditTestimonialModalProps) {
  // Seeded once; the caller keys this by testimonial id. A reset effect on
  // initialData (built inline by the caller) wiped typed edits on every
  // re-render of the page (US-257).
  const [formData, setFormData] = useState<EditTestimonialFormData>(initialData);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl gap-0 border-border bg-card p-0 text-card-foreground"
      >
        <DialogHeader className="border-b border-border p-4 text-left">
          <DialogTitle className="text-xl text-foreground">Edit Testimonial</DialogTitle>
        </DialogHeader>

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
      </DialogContent>
    </Dialog>
  );
}
