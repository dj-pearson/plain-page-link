import type { ReactNode } from 'react';
import { useForm, useFieldArray, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { toastSaveError } from '@/lib/planLimitToast';
import { usePlanUsage } from '@/hooks/usePlanUsage';
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
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RELATIONSHIPS,
  useContacts,
  type Contact,
  type ContactInput,
  type ContactRelationship,
} from '@/hooks/useContacts';
import { TOUCH_FREQUENCIES } from '@/lib/keyDates';

export interface ContactFormDialogProps {
  open: boolean;
  onOpenChange(open: boolean): void;
  contact?: Contact | null;
  initial?: Partial<ContactInput>;
  onSaved?(id: string): void;
}

export const HOUSEHOLD_RELATIONS: { value: string; label: string }[] = [
  { value: 'spouse', label: 'Spouse / partner' },
  { value: 'child', label: 'Child' },
  { value: 'parent', label: 'Parent' },
  { value: 'sibling', label: 'Sibling' },
  { value: 'pet', label: 'Pet' },
  { value: 'other', label: 'Other' },
];

const RELATIONSHIP_VALUES = RELATIONSHIPS.map((r) => r.value) as [
  ContactRelationship,
  ...ContactRelationship[],
];

const schema = z.object({
  first_name: z.string().trim().min(1, 'First name is required'),
  last_name: z.string(),
  email: z.union([z.literal(''), z.string().trim().email('Enter a valid email address')]),
  phone: z.string(),
  relationship: z.enum(RELATIONSHIP_VALUES),
  preferred_contact: z.enum(['none', 'call', 'text', 'email']),
  address: z.string(),
  city: z.string(),
  state: z.string(),
  zip_code: z.string(),
  occupation: z.string(),
  employer: z.string(),
  referred_by: z.string(),
  source: z.string(),
  touch_frequency: z.string(),
  interests: z.string(),
  tags: z.string(),
  notes: z.string(),
  household: z.array(
    z.object({
      name: z.string(),
      relation: z.string(),
      notes: z.string(),
    })
  ),
});

type FormValues = z.infer<typeof schema>;

/** "golf, wine , , boating" → ["golf", "wine", "boating"] */
export function splitList(value: string): string[] {
  return value
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

function toDefaults(source: Partial<ContactInput> | null | undefined): FormValues {
  const s = source ?? {};
  return {
    first_name: s.first_name ?? '',
    last_name: s.last_name ?? '',
    email: s.email ?? '',
    phone: s.phone ?? '',
    relationship: s.relationship ?? 'past_client',
    preferred_contact: s.preferred_contact ?? 'none',
    address: s.address ?? '',
    city: s.city ?? '',
    state: s.state ?? '',
    zip_code: s.zip_code ?? '',
    occupation: s.occupation ?? '',
    employer: s.employer ?? '',
    referred_by: s.referred_by ?? '',
    source: s.source ?? '',
    touch_frequency: s.touch_frequency_days ? String(s.touch_frequency_days) : 'none',
    interests: (s.interests ?? []).join(', '),
    tags: (s.tags ?? []).join(', '),
    notes: s.notes ?? '',
    household: (s.household ?? []).map((m) => ({
      name: m.name,
      relation: m.relation || 'other',
      notes: m.notes ?? '',
    })),
  };
}

function contactToInput(contact: Contact): Partial<ContactInput> {
  const relationship = RELATIONSHIPS.some((r) => r.value === contact.relationship)
    ? (contact.relationship as ContactRelationship)
    : 'sphere';
  const preferred = contact.preferred_contact;
  return {
    ...contact,
    relationship,
    preferred_contact:
      preferred === 'call' || preferred === 'text' || preferred === 'email' ? preferred : null,
  };
}

function toInput(values: FormValues, leadId: string | null | undefined): ContactInput {
  return {
    first_name: values.first_name.trim(),
    last_name: values.last_name.trim() || null,
    email: values.email.trim() || null,
    phone: values.phone.trim() || null,
    relationship: values.relationship,
    preferred_contact: values.preferred_contact === 'none' ? null : values.preferred_contact,
    address: values.address.trim() || null,
    city: values.city.trim() || null,
    state: values.state.trim() || null,
    zip_code: values.zip_code.trim() || null,
    occupation: values.occupation.trim() || null,
    employer: values.employer.trim() || null,
    referred_by: values.referred_by.trim() || null,
    source: values.source.trim() || null,
    touch_frequency_days: values.touch_frequency === 'none' ? null : Number(values.touch_frequency),
    interests: splitList(values.interests),
    tags: splitList(values.tags),
    notes: values.notes.trim() || null,
    household: values.household
      .filter((m) => m.name.trim())
      .map((m) => ({
        name: m.name.trim(),
        relation: m.relation,
        ...(m.notes.trim() ? { notes: m.notes.trim() } : {}),
      })),
    lead_id: leadId ?? null,
  };
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h3 className="text-sm font-semibold text-foreground">{title}</h3>
      {children}
    </section>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} className="text-sm text-destructive">
      {message}
    </p>
  );
}

export function ContactFormDialog({
  open,
  onOpenChange,
  contact,
  initial,
  onSaved,
}: ContactFormDialogProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>{contact ? 'Edit client' : 'Add client'}</DialogTitle>
          <DialogDescription>
            The people behind the deals: who they are, who they live with, and how often to check
            in.
          </DialogDescription>
        </DialogHeader>
        {/* DialogContent unmounts when closed, so the form mounts fresh on every
            open with the contact (or the lead being converted) as its defaults. */}
        <ContactForm
          contact={contact}
          initial={initial}
          onSaved={onSaved}
          onClose={() => onOpenChange(false)}
        />
      </DialogContent>
    </Dialog>
  );
}

interface ContactFormProps {
  contact?: Contact | null;
  initial?: Partial<ContactInput>;
  onSaved?(id: string): void;
  onClose(): void;
}

function ContactForm({ contact, initial, onSaved, onClose }: ContactFormProps) {
  const { createContact, updateContact } = useContacts();
  const { planName } = usePlanUsage();
  const isEdit = !!contact;
  const leadId = contact?.lead_id ?? initial?.lead_id ?? null;

  const {
    register,
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: toDefaults(contact ? contactToInput(contact) : initial),
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'household' });

  const onSubmit = async (values: FormValues) => {
    const input = toInput(values, leadId);
    try {
      if (contact) {
        await updateContact.mutateAsync({ id: contact.id, input });
        toast.success(`${input.first_name} updated`);
        onSaved?.(contact.id);
      } else {
        const id = await createContact.mutateAsync(input);
        toast.success(`${input.first_name} added to your clients`);
        onSaved?.(id);
      }
      onClose();
    } catch (error) {
      // Email and phone are encrypted before they are written; if that step
      // fails the save fails as a whole, so there is no partial record to explain.
      // A plan's client limit is the other refusal, and gets its own message.
      toastSaveError(error, 'Could not save. Please try again.', planName);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      <Section title="Contact">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-first-name">First name</Label>
            <Input
              id="contact-first-name"
              autoComplete="given-name"
              className="h-11"
              aria-invalid={!!errors.first_name}
              aria-describedby={errors.first_name ? 'contact-first-name-error' : undefined}
              {...register('first_name')}
            />
            <FieldError id="contact-first-name-error" message={errors.first_name?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-last-name">Last name</Label>
            <Input
              id="contact-last-name"
              autoComplete="family-name"
              className="h-11"
              {...register('last_name')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-email">Email</Label>
            <Input
              id="contact-email"
              type="email"
              inputMode="email"
              autoComplete="email"
              className="h-11"
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'contact-email-error' : undefined}
              {...register('email')}
            />
            <FieldError id="contact-email-error" message={errors.email?.message} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-phone">Phone</Label>
            <Input
              id="contact-phone"
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              className="h-11"
              {...register('phone')}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-relationship">Relationship</Label>
            <Controller
              control={control}
              name="relationship"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contact-relationship" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RELATIONSHIPS.map((r) => (
                      <SelectItem key={r.value} value={r.value}>
                        {r.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-preferred">Prefers</Label>
            <Controller
              control={control}
              name="preferred_contact"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contact-preferred" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No preference</SelectItem>
                    <SelectItem value="call">A call</SelectItem>
                    <SelectItem value="text">A text</SelectItem>
                    <SelectItem value="email">An email</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
        </div>
      </Section>

      <Section title="Household">
        <p className="text-sm text-muted-foreground">
          Partners, kids and pets — the names you want to get right at the door.
        </p>
        {fields.length > 0 && (
          <ul className="space-y-3">
            {fields.map((field, index) => (
              <li
                key={field.id}
                className="grid gap-3 rounded-xl border border-border p-3 sm:grid-cols-[1fr_10rem_auto]"
              >
                <div className="space-y-1.5">
                  <Label htmlFor={`household-${index}-name`}>Name</Label>
                  <Input
                    id={`household-${index}-name`}
                    className="h-11"
                    {...register(`household.${index}.name` as const)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`household-${index}-relation`}>Relation</Label>
                  <Controller
                    control={control}
                    name={`household.${index}.relation` as const}
                    render={({ field: relField }) => (
                      <Select value={relField.value} onValueChange={relField.onChange}>
                        <SelectTrigger id={`household-${index}-relation`} className="h-11">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {HOUSEHOLD_RELATIONS.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                <div className="flex items-end">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => remove(index)}
                    aria-label={`Remove household member ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-1.5 sm:col-span-3">
                  <Label htmlFor={`household-${index}-notes`}>Notes</Label>
                  <Input
                    id={`household-${index}-notes`}
                    className="h-11"
                    placeholder="Loves horses, starts college in the fall…"
                    {...register(`household.${index}.notes` as const)}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => append({ name: '', relation: 'spouse', notes: '' })}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add household member
        </Button>
      </Section>

      <Section title="Staying in touch">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-cadence">Check in</Label>
            <Controller
              control={control}
              name="touch_frequency"
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="contact-cadence" className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {TOUCH_FREQUENCIES.map((f) => (
                      <SelectItem key={f.value} value={String(f.value)}>
                        {f.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-interests">Interests</Label>
            <Input
              id="contact-interests"
              className="h-11"
              placeholder="Golf, wine, the Cubs"
              aria-describedby="contact-list-hint"
              {...register('interests')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-tags">Tags</Label>
            <Input
              id="contact-tags"
              className="h-11"
              placeholder="VIP, investor, pop-by list"
              aria-describedby="contact-list-hint"
              {...register('tags')}
            />
            <p id="contact-list-hint" className="text-xs text-muted-foreground">
              Separate interests and tags with commas.
            </p>
          </div>
        </div>
      </Section>

      <Section title="Address">
        <div className="grid gap-4 sm:grid-cols-6">
          <div className="space-y-1.5 sm:col-span-6">
            <Label htmlFor="contact-address">Street address</Label>
            <Input
              id="contact-address"
              autoComplete="street-address"
              className="h-11"
              {...register('address')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-3">
            <Label htmlFor="contact-city">City</Label>
            <Input
              id="contact-city"
              autoComplete="address-level2"
              className="h-11"
              {...register('city')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-1">
            <Label htmlFor="contact-state">State</Label>
            <Input
              id="contact-state"
              autoComplete="address-level1"
              className="h-11"
              {...register('state')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-zip">ZIP</Label>
            <Input
              id="contact-zip"
              inputMode="numeric"
              autoComplete="postal-code"
              className="h-11"
              {...register('zip_code')}
            />
          </div>
        </div>
      </Section>

      <Section title="Background">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="contact-occupation">Occupation</Label>
            <Input id="contact-occupation" className="h-11" {...register('occupation')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-employer">Employer</Label>
            <Input id="contact-employer" className="h-11" {...register('employer')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-referred-by">Referred by</Label>
            <Input id="contact-referred-by" className="h-11" {...register('referred_by')} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contact-source">Source</Label>
            <Input
              id="contact-source"
              className="h-11"
              placeholder="Open house, referral, sphere…"
              {...register('source')}
            />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="contact-notes">Notes</Label>
            <Textarea id="contact-notes" rows={4} {...register('notes')} />
          </div>
        </div>
      </Section>

      <DialogFooter className="gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving…' : isEdit ? 'Save changes' : 'Add client'}
        </Button>
      </DialogFooter>
    </form>
  );
}
