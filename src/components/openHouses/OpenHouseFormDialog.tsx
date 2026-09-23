/**
 * Schedule or edit an open house.
 *
 * The form works in the agent's local date and times — that is how an open
 * house is thought about ("Saturday, 1 to 3") — and converts to ISO instants
 * for starts_at / ends_at only on submit. Editing converts back the same way,
 * so a round trip does not drift by a timezone offset.
 */
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format, isSaturday, nextSaturday } from 'date-fns';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useListings } from '@/hooks/useListings';
import { formatOpenHouseAddress, useOpenHouses, type OpenHouse } from '@/hooks/useOpenHouses';

interface OpenHouseFormDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  openHouse?: OpenHouse | null;
  defaultListingId?: string;
}

/** A listing can host an open house while it is still on the market. */
const SCHEDULABLE_STATUSES = new Set(['active', 'pending', 'under_contract']);

const formSchema = z
  .object({
    listing_id: z.string().min(1, 'Choose a listing'),
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Choose a date'),
    start_time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose a start time'),
    end_time: z.string().regex(/^\d{2}:\d{2}$/, 'Choose an end time'),
    is_public: z.boolean(),
    public_notes: z.string().max(1000, 'Keep this under 1,000 characters'),
    private_notes: z.string().max(2000, 'Keep this under 2,000 characters'),
  })
  // "HH:mm" strings compare correctly as text.
  .refine((v) => v.end_time > v.start_time, {
    message: 'End time must be after the start time',
    path: ['end_time'],
  });

type FormValues = z.infer<typeof formSchema>;

/** Local date + time → ISO instant. `new Date('YYYY-MM-DDTHH:mm')` is local time. */
function toIso(date: string, time: string): string {
  return new Date(`${date}T${time}`).toISOString();
}

function defaultDate(): string {
  const today = new Date();
  return format(isSaturday(today) ? today : nextSaturday(today), 'yyyy-MM-dd');
}

function valuesFor(openHouse: OpenHouse | null | undefined, defaultListingId?: string): FormValues {
  if (openHouse) {
    const start = new Date(openHouse.starts_at);
    const end = new Date(openHouse.ends_at);
    return {
      listing_id: openHouse.listing_id,
      date: format(start, 'yyyy-MM-dd'),
      start_time: format(start, 'HH:mm'),
      end_time: format(end, 'HH:mm'),
      is_public: openHouse.is_public,
      public_notes: openHouse.public_notes ?? '',
      private_notes: openHouse.private_notes ?? '',
    };
  }
  return {
    listing_id: defaultListingId ?? '',
    date: defaultDate(),
    start_time: '13:00',
    end_time: '15:00',
    is_public: true,
    public_notes: '',
    private_notes: '',
  };
}

export function OpenHouseFormDialog({
  open,
  onOpenChange,
  openHouse,
  defaultListingId,
}: OpenHouseFormDialogProps) {
  const isEditing = !!openHouse;
  const { listings, isLoading: listingsLoading } = useListings();
  const { createOpenHouse, updateOpenHouse } = useOpenHouses();

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: valuesFor(openHouse, defaultListingId),
  });

  // Fresh values each time the dialog opens, so editing one open house and
  // then scheduling another does not carry the first one's fields over.
  useEffect(() => {
    if (open) reset(valuesFor(openHouse, defaultListingId));
  }, [open, openHouse, defaultListingId, reset]);

  const listingOptions = useMemo(
    () =>
      listings
        .filter(
          (l) =>
            SCHEDULABLE_STATUSES.has(l.status ?? '') ||
            // Keep the current listing selectable when editing, even if it has
            // since sold.
            l.id === openHouse?.listing_id
        )
        .map((l) => ({ id: l.id, label: formatOpenHouseAddress(l) })),
    [listings, openHouse?.listing_id]
  );

  const onSubmit = async (values: FormValues) => {
    const input = {
      listing_id: values.listing_id,
      starts_at: toIso(values.date, values.start_time),
      ends_at: toIso(values.date, values.end_time),
      is_public: values.is_public,
      public_notes: values.public_notes.trim() || null,
      private_notes: values.private_notes.trim() || null,
    };
    try {
      if (openHouse) {
        await updateOpenHouse.mutateAsync({ id: openHouse.id, input });
        toast.success('Open house updated');
      } else {
        await createOpenHouse.mutateAsync(input);
        toast.success('Open house scheduled', {
          description: values.is_public
            ? 'It now shows on your public page.'
            : 'It is private — only you can see it.',
        });
      }
      onOpenChange(false);
    } catch {
      toast.error(
        openHouse
          ? "Couldn't update the open house. Please try again."
          : "Couldn't schedule the open house. Please try again."
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit open house' : 'Schedule open house'}</DialogTitle>
          <DialogDescription>
            Visitors sign in on a tablet at the door, and each sign-in lands in your Leads.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <Label htmlFor="oh-listing">Listing</Label>
            <Controller
              control={control}
              name="listing_id"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={listingsLoading}
                >
                  <SelectTrigger
                    id="oh-listing"
                    className="min-h-[44px]"
                    aria-invalid={!!errors.listing_id}
                  >
                    <SelectValue
                      placeholder={
                        listingsLoading
                          ? 'Loading listings…'
                          : listingOptions.length === 0
                            ? 'No active listings'
                            : 'Choose a listing'
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {listingOptions.map((l) => (
                      <SelectItem key={l.id} value={l.id}>
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.listing_id && (
              <p className="text-sm text-red-600">{errors.listing_id.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor="oh-date">Date</Label>
              <Input id="oh-date" type="date" className="min-h-[44px]" {...register('date')} />
              {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oh-start">Starts</Label>
              <Input
                id="oh-start"
                type="time"
                step={900}
                className="min-h-[44px]"
                {...register('start_time')}
              />
              {errors.start_time && (
                <p className="text-sm text-red-600">{errors.start_time.message}</p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oh-end">Ends</Label>
              <Input
                id="oh-end"
                type="time"
                step={900}
                className="min-h-[44px]"
                aria-invalid={!!errors.end_time}
                {...register('end_time')}
              />
              {errors.end_time && <p className="text-sm text-red-600">{errors.end_time.message}</p>}
            </div>
          </div>

          <Controller
            control={control}
            name="is_public"
            render={({ field }) => (
              <div className="flex min-h-[44px] items-center justify-between gap-4 rounded-lg border border-gray-200 px-3 py-2">
                <div>
                  <Label htmlFor="oh-public">Show on my public page</Label>
                  <p className="text-sm text-gray-600">
                    Visitors can add it to their calendar and get directions.
                  </p>
                </div>
                <Switch id="oh-public" checked={field.value} onCheckedChange={field.onChange} />
              </div>
            )}
          />

          <div className="space-y-1.5">
            <Label htmlFor="oh-public-notes">Public notes</Label>
            <Textarea
              id="oh-public-notes"
              rows={2}
              placeholder="Shown to visitors — parking, refreshments"
              {...register('public_notes')}
            />
            {errors.public_notes && (
              <p className="text-sm text-red-600">{errors.public_notes.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="oh-private-notes">Private notes</Label>
            <Textarea
              id="oh-private-notes"
              rows={2}
              placeholder="Only you see this — lockbox code, seller instructions"
              {...register('private_notes')}
            />
            {errors.private_notes && (
              <p className="text-sm text-red-600">{errors.private_notes.message}</p>
            )}
          </div>

          <DialogFooter className="gap-2 pt-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />}
              {isEditing ? 'Save changes' : 'Schedule'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
