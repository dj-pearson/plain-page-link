/**
 * Schedule or edit an open house.
 *
 * The form works in wall-clock date and times — that is how an open house is
 * thought about ("Saturday, 1 to 3") — in the agent's saved time zone
 * (profiles.timezone), falling back to this device's zone only when none is
 * saved (US-628). It converts to ISO instants for starts_at / ends_at only on
 * submit, and editing converts back in the same zone, so a round trip does
 * not drift and a travelling agent does not save the wrong instant.
 */
import { useEffect, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { toastSaveError } from '@/lib/planLimitToast';
import { usePlanUsage } from '@/hooks/usePlanUsage';
import { useAgentTimeZone } from '@/hooks/useAgentTimeZone';
import { timeZoneLabel } from '@/lib/timeZone';
import {
  defaultOpenHouseDate,
  isoToWallTime,
  pastStartError,
  wallTimeToIso,
} from '@/lib/openHouseSchedule';
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

const baseSchema = z
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

type FormValues = z.infer<typeof baseSchema>;

/**
 * The form schema for one zone. A start already in the past is refused (it
 * would count against open_houses_per_month and open the kiosk for a house
 * nobody is at), except when editing an open house whose start has not moved.
 */
export function buildOpenHouseSchema(timeZone: string, originalStartsAt?: string | null) {
  return baseSchema.superRefine((v, ctx) => {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(v.date) || !/^\d{2}:\d{2}$/.test(v.start_time)) return;
    const message = pastStartError(
      wallTimeToIso(v.date, v.start_time, timeZone),
      new Date(),
      originalStartsAt
    );
    if (message) ctx.addIssue({ code: z.ZodIssueCode.custom, message, path: ['start_time'] });
  });
}

function valuesFor(
  openHouse: OpenHouse | null | undefined,
  timeZone: string,
  defaultListingId?: string
): FormValues {
  if (openHouse) {
    const start = isoToWallTime(openHouse.starts_at, timeZone);
    const end = isoToWallTime(openHouse.ends_at, timeZone);
    return {
      listing_id: openHouse.listing_id,
      date: start.date,
      start_time: start.time,
      end_time: end.time,
      is_public: openHouse.is_public,
      public_notes: openHouse.public_notes ?? '',
      private_notes: openHouse.private_notes ?? '',
    };
  }
  return {
    listing_id: defaultListingId ?? '',
    date: defaultOpenHouseDate(timeZone),
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
  const { planName } = usePlanUsage();
  const { timeZone: savedZone, detected } = useAgentTimeZone();
  const timeZone = savedZone ?? detected ?? 'UTC';
  const schema = useMemo(
    () => buildOpenHouseSchema(timeZone, openHouse?.starts_at),
    [timeZone, openHouse?.starts_at]
  );

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: valuesFor(openHouse, timeZone, defaultListingId),
  });

  // Fresh values each time the dialog opens, so editing one open house and
  // then scheduling another does not carry the first one's fields over.
  useEffect(() => {
    if (open) reset(valuesFor(openHouse, timeZone, defaultListingId));
  }, [open, openHouse, timeZone, defaultListingId, reset]);

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
      starts_at: wallTimeToIso(values.date, values.start_time, timeZone),
      ends_at: wallTimeToIso(values.date, values.end_time, timeZone),
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
    } catch (error) {
      // A month already at the plan's open-house allowance is refused by the
      // database; say that, not "try again".
      toastSaveError(
        error,
        openHouse
          ? "Couldn't update the open house. Please try again."
          : "Couldn't schedule the open house. Please try again.",
        planName
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
              <Input
                id="oh-date"
                type="date"
                className="min-h-[44px]"
                aria-describedby="oh-zone"
                {...register('date')}
              />
              {errors.date && <p className="text-sm text-red-600">{errors.date.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="oh-start">Starts</Label>
              <Input
                id="oh-start"
                type="time"
                step={900}
                className="min-h-[44px]"
                aria-invalid={!!errors.start_time}
                aria-describedby="oh-zone"
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
          <p id="oh-zone" className="-mt-2 text-sm text-gray-600">
            {savedZone
              ? `Times are in ${timeZoneLabel(timeZone)}.`
              : `Times are in this device's time zone, ${timeZoneLabel(timeZone)}. Set yours in Settings.`}
          </p>

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
