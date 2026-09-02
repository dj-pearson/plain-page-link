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
 */
import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Star, Trash2, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useListingImageUpload } from '@/hooks/useListingImageUpload';

interface ListingPhotoManagerProps {
  photos: string[];
  onChange: (photos: string[]) => void;
  listingId?: string;
}

export function ListingPhotoManager({ photos, onChange, listingId }: ListingPhotoManagerProps) {
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
      onChange([...photos, ...urls]);
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
        <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {photos.map((url, index) => (
            <li
              key={url}
              className="group relative aspect-square overflow-hidden rounded-lg border"
            >
              <img src={url} alt={`Photo ${index + 1}`} className="h-full w-full object-cover" />
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
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
