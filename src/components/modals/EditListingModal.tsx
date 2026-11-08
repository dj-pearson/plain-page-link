import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
  highlights?: string;
  is_featured?: boolean;
}

interface EditListingModalProps {
  isOpen: boolean;
  onClose: () => void;
  /**
   * `uploaded` is every photo URL uploaded while the dialog was open, so the
   * caller can remove the ones the save did not keep (US-461). Resolves true
   * once the save landed: the caller then owns those uploads, and the dialog
   * no longer discards them when it unmounts (US-512).
   */
  onSubmit: (data: EditListingFormData, uploaded: string[]) => Promise<boolean> | boolean;
  /**
   * Called with photos uploaded in this dialog that are not on the saved
   * listing, when the dialog closes without saving (US-461).
   */
  onDiscardUploads?: (urls: string[]) => void;
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
  onDiscardUploads,
}: EditListingModalProps) {
  // Seeded once. There used to be an effect that reset this whenever
  // initialData changed — and the caller builds initialData inline, so every
  // re-render of the Listings page wiped what the agent had typed (US-257).
  // The caller keys this component by listing id, so a different listing
  // still mounts a fresh form.
  const [formData, setFormData] = useState<EditListingFormData>(initialData);

  // Photos uploaded while this dialog is open (US-461). ListingPhotoManager
  // uploads the moment files are picked, so a cancel used to leave them
  // public in the bucket with no row pointing at them.
  const uploadedRef = useRef<string[]>([]);
  // Set once this session's uploads are accounted for: discarded on a close,
  // or handed to the caller by a save that landed.
  const closedRef = useRef(false);
  const savingRef = useRef(false);
  const unmountedRef = useRef(false);
  // The unmount cleanup runs with the first render's closure; read the latest
  // props through refs.
  const onDiscardRef = useRef(onDiscardUploads);
  onDiscardRef.current = onDiscardUploads;
  const savedPhotosRef = useRef(initialData.photos);
  savedPhotosRef.current = initialData.photos;

  /** Discard this session's uploads that are not on the saved listing, once. */
  const discardSession = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    // Only this session's uploads: a photo already on the saved listing is
    // never a candidate, whatever the agent did to it in the form.
    const saved = new Set(savedPhotosRef.current);
    const unsaved = uploadedRef.current.filter((url) => !saved.has(url));
    uploadedRef.current = [];
    if (unsaved.length > 0) onDiscardRef.current?.(unsaved);
  };

  const handleUploaded = (urls: string[]) => {
    // An upload that finishes after the dialog closed can never be saved.
    if (closedRef.current) {
      onDiscardRef.current?.(urls);
      return;
    }
    uploadedRef.current = [...uploadedRef.current, ...urls];
  };

  // US-512: leaving the Listings page with the dialog open, or the lazy-modal
  // error boundary replacing it, unmounts the dialog without onOpenChange or
  // Cancel, so that session's uploads were never discarded. A save still in
  // flight is left to finish: handleSubmit discards if it fails.
  const discardOnUnmountRef = useRef(discardSession);
  discardOnUnmountRef.current = discardSession;
  useEffect(
    () => () => {
      unmountedRef.current = true;
      if (!savingRef.current) discardOnUnmountRef.current();
    },
    []
  );

  const handleClose = () => {
    discardSession();
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (savingRef.current) return;
    savingRef.current = true;
    let saved = false;
    try {
      saved = await onSubmit(formData, [...uploadedRef.current]);
    } catch {
      // Treated as not saved; the caller reports the error.
    } finally {
      savingRef.current = false;
    }
    if (saved) {
      // The caller removed what the save did not keep (US-461).
      closedRef.current = true;
      uploadedRef.current = [];
    } else if (unmountedRef.current) {
      // The dialog went away while the save was failing; nothing can retry it.
      discardSession();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-2xl gap-0 border-border bg-card p-0 text-card-foreground"
      >
        <DialogHeader className="border-b border-border p-4 text-left">
          <DialogTitle className="text-xl text-foreground">Edit Property Listing</DialogTitle>
        </DialogHeader>

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
                onUploaded={handleUploaded}
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
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={handleClose} className="flex-1">
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
