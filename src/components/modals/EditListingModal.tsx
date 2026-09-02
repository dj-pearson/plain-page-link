import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { parseSquareFeet } from '@/lib/format';
import { LISTING_STATUSES } from '@/lib/listingStatus';
import { ListingPhotoManager } from '@/components/listings/ListingPhotoManager';

export interface EditListingFormData {
  address: string;
  city: string;
  price: string;
  /** Canonical column. `beds` is GENERATED from it since US-106. */
  bedrooms: number;
  /** Canonical column, numeric — 2.5 is a real value here. */
  bathrooms: number;
  square_feet?: number;
  status: string;
  /** The gallery. `image` is derived from photos[0] by the caller. */
  photos: string[];
  description?: string;
  mls_number?: string;
  property_type?: string;
  /** Columns the edit form never exposed, so an agent could only set them at
   *  creation and never correct them (US-107). */
  state?: string;
  zip_code?: string;
  lot_size_acres?: number;
  virtual_tour_url?: string;
  open_house_date?: string;
  highlights?: string;
  is_featured?: boolean;
}

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: EditListingFormData) => void;
  initialData: EditListingFormData;
  /** Used to group newly uploaded photos under the listing's own folder. */
  listingId?: string;
}

export function EditListingModal({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  listingId,
}: EditListingModalProps) {
  const [formData, setFormData] = useState<EditListingFormData>(initialData);

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
          <h2 className="text-xl font-semibold">Edit Property Listing</h2>
          <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="address">Street Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="price">Price *</Label>
              <Input
                id="price"
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                placeholder="$450,000"
                required
              />
            </div>

            <div>
              <Label htmlFor="bedrooms">Bedrooms *</Label>
              <Input
                id="bedrooms"
                type="number"
                min={0}
                value={formData.bedrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bedrooms: Number(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="bathrooms">Bathrooms *</Label>
              <Input
                id="bathrooms"
                type="number"
                // step 0.5 to match the Add form, which has always offered
                // half-baths — into an integer column that rejected them
                // (US-106). parseInt also truncated 2.5 to 2 here.
                step={0.5}
                min={0}
                value={formData.bathrooms}
                onChange={(e) =>
                  setFormData({ ...formData, bathrooms: Number(e.target.value) || 0 })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="square_feet">Square Feet</Label>
              <Input
                id="square_feet"
                type="number"
                min={0}
                value={formData.square_feet ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    square_feet: parseSquareFeet(e.target.value) ?? undefined,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="status">Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LISTING_STATUSES.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="property_type">Property Type</Label>
              <Select
                value={formData.property_type || ''}
                onValueChange={(value) => setFormData({ ...formData, property_type: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="single_family">Single Family</SelectItem>
                  <SelectItem value="condo">Condo</SelectItem>
                  <SelectItem value="townhouse">Townhouse</SelectItem>
                  <SelectItem value="multi_family">Multi-Family</SelectItem>
                  <SelectItem value="land">Land</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="mls_number">MLS Number</Label>
              <Input
                id="mls_number"
                value={formData.mls_number || ''}
                onChange={(e) => setFormData({ ...formData, mls_number: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe the property features..."
              />
            </div>

            <div className="col-span-2">
              {/* Was a single raw "Image URL" text box: no add, no remove, no
                  reorder, so photos could not be managed at all (US-107). */}
              <ListingPhotoManager
                photos={formData.photos}
                onChange={(photos) => setFormData({ ...formData, photos })}
                listingId={listingId}
              />
            </div>

            <div>
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                maxLength={2}
                value={formData.state || ''}
                onChange={(e) => setFormData({ ...formData, state: e.target.value.toUpperCase() })}
              />
            </div>

            <div>
              <Label htmlFor="zip_code">ZIP Code</Label>
              <Input
                id="zip_code"
                inputMode="numeric"
                value={formData.zip_code || ''}
                onChange={(e) => setFormData({ ...formData, zip_code: e.target.value })}
              />
            </div>

            <div>
              <Label htmlFor="lot_size_acres">Lot Size (acres)</Label>
              <Input
                id="lot_size_acres"
                type="number"
                step={0.01}
                min={0}
                value={formData.lot_size_acres ?? ''}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    lot_size_acres: e.target.value ? Number(e.target.value) : undefined,
                  })
                }
              />
            </div>

            <div>
              <Label htmlFor="open_house_date">Open House</Label>
              <Input
                id="open_house_date"
                type="date"
                value={formData.open_house_date || ''}
                onChange={(e) => setFormData({ ...formData, open_house_date: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="virtual_tour_url">Virtual Tour URL</Label>
              <Input
                id="virtual_tour_url"
                type="url"
                placeholder="https://..."
                value={formData.virtual_tour_url || ''}
                onChange={(e) => setFormData({ ...formData, virtual_tour_url: e.target.value })}
              />
            </div>

            <div className="col-span-2">
              <Label htmlFor="highlights">Property Highlights</Label>
              <Input
                id="highlights"
                placeholder="Updated kitchen, corner lot, new roof"
                value={formData.highlights || ''}
                onChange={(e) => setFormData({ ...formData, highlights: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Comma-separated list of standout features.
              </p>
            </div>

            <div className="col-span-2 flex items-center gap-2">
              <input
                id="is_featured"
                type="checkbox"
                checked={!!formData.is_featured}
                onChange={(e) => setFormData({ ...formData, is_featured: e.target.checked })}
                className="h-4 w-4"
              />
              <Label htmlFor="is_featured" className="mb-0">
                Feature this listing on my profile
              </Label>
            </div>

            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={4}
                placeholder="Describe the property features..."
              />
            </div>
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
