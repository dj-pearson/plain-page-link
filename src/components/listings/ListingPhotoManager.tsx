/**
 * Add, remove and reorder a listing's photos.
 *
 * US-107: the edit modal had a single raw "Image URL" text input. An agent
 * could not add a photo, remove one, or change which appeared first — the only
 * way to change a listing's photos was to delete it and re-enter everything.
 *
 * `photos` is the gallery and `image` is the card thumbnail, so the two must
 * agree: the caller writes image = photos[0], and reordering is therefore how
 * the cover photo is chosen.
 *
 * US-235: each photo carries alt text. Before, there was nowhere to write it,
 * and every renderer announced the street address for every photo.
 *
 * "Suggest" drafts from the listing details, deliberately without AI: no model
 * here can see the photo, and a text model asked to describe one it cannot see
 * invents a kitchen that is not there. The draft says what is known and the
 * agent adds what the photo shows.
 */
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Sparkles, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useListingImageUpload } from '@/hooks/useListingImageUpload';
import type { ListingPhoto } from '@/lib/listingPhotos';

export interface PhotoSuggestContext {
  address?: string;
  propertyType?: string | null;
  bedrooms?: number | null;
  bathrooms?: number | null;
}

interface ListingPhotoManagerProps {
  photos: ListingPhoto[];
  onChange: (photos: ListingPhoto[]) => void;
  listingId?: string;
  /** What "Suggest" drafts from. */
  details?: PhotoSuggestContext;
}

/** A starting point the agent finishes; see the header for why not AI. */
export function draftAltText(details: PhotoSuggestContext | undefined, index: number): string {
  const kind = details?.propertyType?.trim() || 'Home';
  const rooms = [
    details?.bedrooms ? `${details.bedrooms}-bedroom` : '',
    details?.bathrooms ? `${details.bathrooms}-bathroom` : '',
  ]
    .filter(Boolean)
    .join(', ');
  const at = details?.address?.trim() ? ` at ${details.address.trim()}` : '';
  const subject = rooms ? `${rooms} ${kind.toLowerCase()}` : kind;
  return index === 0 ? `${subject[0].toUpperCase()}${subject.slice(1)}${at}: ` : `${kind}${at}, photo ${index + 1}: `;
}

export function ListingPhotoManager({ photos, onChange, listingId, details }: ListingPhotoManagerProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { uploadListingImages, uploading, progress } = useListingImageUpload();
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setError(null);
    try {
      // Throws since US-107, so a rejected file leaves the existing photos
      // untouched rather than silently returning an empty list.
      const urls = await uploadListingImages(Array.from(files), listingId);
      onChange([...photos, ...urls.map((url) => ({ url, alt: '' }))]);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Those photos could not be uploaded');
    } finally {
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const move = (from: number, to: number) => {
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    onChange(next);
  };

  const remove = (index: number) => onChange(photos.filter((_, i) => i !== index));
  const setAlt = (index: number, alt: string) =>
    onChange(photos.map((p, i) => (i === index ? { ...p, alt } : p)));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">
          Photos{photos.length > 0 ? ` (${photos.length})` : ''}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={uploading}
          onClick={() => inputRef.current?.click()}
          className="gap-2"
        >
          {uploading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              {progress.total > 0 ? `${progress.current}/${progress.total}` : 'Uploading'}
            </>
          ) : (
            <>
              <Upload className="h-4 w-4" /> Add photos
            </>
          )}
        </Button>
      </div>

      <input
        ref={inputRef}
        type="file"
        multiple
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={(e) => void handleFiles(e.target.files)}
      />

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}

      {photos.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No photos yet. The first photo you add becomes the listing card image.
        </p>
      ) : (
        <>
        <p id="photo-alt-help" className="text-xs text-muted-foreground">
          Describe each photo for visitors who use a screen reader — what it shows, not that it is a photo.
          For example: “Kitchen with white cabinets, quartz island and pendant lights.”
        </p>
        <p className="text-xs text-muted-foreground">
          <a href="/accessibility/agents#photos" target="_blank" rel="noopener noreferrer" className="underline">
            How to write a good description<span className="sr-only"> (opens in a new tab)</span>
          </a>
        </p>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {photos.map((photo, index) => (
            <li key={photo.url} className="space-y-1.5">
            <div className="group relative aspect-square overflow-hidden rounded-lg border">
              <img src={photo.url} alt="" className="h-full w-full object-cover" />
              {index === 0 && (
                <span className="absolute left-1 top-1 inline-flex items-center gap-1 rounded bg-black/70 px-1.5 py-0.5 text-[10px] font-medium text-white">
                  <Star className="h-3 w-3 fill-current" /> Cover
                </span>
              )}
              <div className="absolute inset-x-0 bottom-0 flex justify-center gap-1 bg-black/60 p-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} earlier`}
                  disabled={index === 0}
                  onClick={() => move(index, index - 1)}
                  className="rounded p-1 text-white disabled:opacity-30"
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Move photo ${index + 1} later`}
                  disabled={index === photos.length - 1}
                  onClick={() => move(index, index + 1)}
                  className="rounded p-1 text-white disabled:opacity-30"
                >
                  <ArrowRight className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  aria-label={`Remove photo ${index + 1}`}
                  onClick={() => remove(index)}
                  className="rounded p-1 text-white"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
              <label htmlFor={`photo-alt-${index}`} className="sr-only">
                Description of photo {index + 1}
              </label>
              <div className="flex gap-1">
                <Input
                  id={`photo-alt-${index}`}
                  value={photo.alt}
                  onChange={(e) => setAlt(index, e.target.value)}
                  placeholder={`Describe photo ${index + 1}`}
                  aria-describedby="photo-alt-help"
                  maxLength={250}
                  className="min-h-[44px] text-sm"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="min-h-[44px] min-w-[44px] shrink-0"
                  aria-label={`Suggest a description for photo ${index + 1}`}
                  title="Suggest a starting description"
                  onClick={() => {
                    if (!photo.alt.trim()) setAlt(index, draftAltText(details, index));
                    document.getElementById(`photo-alt-${index}`)?.focus();
                  }}
                >
                  <Sparkles className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
        </>
      )}
    </div>
  );
}
