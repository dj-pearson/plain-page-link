import { useState, type FormEvent } from 'react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useKeyDates, type KeyDateInput, type KeyDateRow } from '@/hooks/useContacts';
import { KEY_DATE_KINDS, parseCalendarDate, toCalendarDate } from '@/lib/keyDates';

export interface KeyDateFormProps {
  contactId: string;
  householdNames: string[];
  keyDate?: KeyDateRow;
  onDone(): void;
}

/** The year an unknown-year date is stored under. A leap year, so Feb 29 survives. */
const UNKNOWN_YEAR = 2000;

const SELF = '__self';
const OTHER = '__other';

function kindDefaults(kind: string): { label: string; recurs: boolean } {
  const found = KEY_DATE_KINDS.find((k) => k.value === kind);
  if (!found || found.value === 'custom') return { label: '', recurs: found?.recurs ?? false };
  return { label: found.label, recurs: found.recurs };
}

function initialWhose(
  personName: string | null | undefined,
  householdNames: string[]
): { choice: string; other: string } {
  if (!personName) return { choice: SELF, other: '' };
  if (householdNames.includes(personName)) return { choice: personName, other: '' };
  return { choice: OTHER, other: personName };
}

/**
 * Builds the stored `event_date`. When the year is unknown the month and day
 * of the picked date are kept and the year is replaced with 2000, which is how
 * the table marks "we only know the day" alongside year_known = false.
 */
export function toStoredEventDate(value: string, yearKnown: boolean): string | null {
  const parsed = parseCalendarDate(value);
  if (!parsed) return null;
  if (yearKnown) return toCalendarDate(parsed);
  const mm = String(parsed.getMonth() + 1).padStart(2, '0');
  const dd = String(parsed.getDate()).padStart(2, '0');
  return `${UNKNOWN_YEAR}-${mm}-${dd}`;
}

export function KeyDateForm({ contactId, householdNames, keyDate, onDone }: KeyDateFormProps) {
  const { addKeyDate, updateKeyDate } = useKeyDates(contactId);
  const idPrefix = keyDate ? `kd-${keyDate.id}` : 'kd-new';

  const startKind = keyDate?.kind ?? 'birthday';
  const whose = initialWhose(keyDate?.person_name, householdNames);

  const [kind, setKind] = useState(startKind);
  const [label, setLabel] = useState(keyDate?.label ?? kindDefaults(startKind).label);
  const [whoseChoice, setWhoseChoice] = useState(whose.choice);
  const [whoseOther, setWhoseOther] = useState(whose.other);
  const [date, setDate] = useState(keyDate?.event_date ?? '');
  const [yearUnknown, setYearUnknown] = useState(keyDate ? !keyDate.year_known : false);
  const [recurs, setRecurs] = useState(keyDate?.recurs_annually ?? kindDefaults(startKind).recurs);
  const [remindDays, setRemindDays] = useState(String(keyDate?.remind_days_before ?? 7));
  const [notes, setNotes] = useState(keyDate?.notes ?? '');
  const [error, setError] = useState<string | null>(null);

  const saving = addKeyDate.isPending || updateKeyDate.isPending;

  const handleKindChange = (next: string) => {
    const previous = kindDefaults(kind);
    const defaults = kindDefaults(next);
    setKind(next);
    setRecurs(defaults.recurs);
    // Only replace the label while it is still the suggestion for the old kind.
    if (!label.trim() || label === previous.label) setLabel(defaults.label);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const trimmedLabel = label.trim();
    if (!trimmedLabel) {
      setError('Give the date a label, e.g. "Birthday".');
      return;
    }
    const yearKnown = !(recurs && yearUnknown);
    const eventDate = toStoredEventDate(date, yearKnown);
    if (!eventDate) {
      setError('Pick a date.');
      return;
    }
    const remind = Number(remindDays);
    if (!Number.isInteger(remind) || remind < 0 || remind > 90) {
      setError('Reminder lead time must be between 0 and 90 days.');
      return;
    }

    const personName =
      whoseChoice === SELF ? null : whoseChoice === OTHER ? whoseOther.trim() || null : whoseChoice;

    const input: KeyDateInput = {
      contact_id: contactId,
      kind,
      label: trimmedLabel,
      person_name: personName,
      event_date: eventDate,
      year_known: yearKnown,
      recurs_annually: recurs,
      remind_days_before: remind,
      notes: notes.trim() || null,
    };

    try {
      if (keyDate) {
        await updateKeyDate.mutateAsync({ id: keyDate.id, input });
        toast.success('Date updated');
      } else {
        await addKeyDate.mutateAsync(input);
        toast.success('Date added');
      }
      onDone();
    } catch {
      toast.error('Could not save the date. Please try again.');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-4 rounded-xl border border-border bg-muted/40 p-4"
      aria-label={keyDate ? 'Edit key date' : 'Add key date'}
      noValidate
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-kind`}>Kind of date</Label>
          <Select value={kind} onValueChange={handleKindChange}>
            <SelectTrigger id={`${idPrefix}-kind`} className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KEY_DATE_KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-label`}>Label</Label>
          <Input
            id={`${idPrefix}-label`}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            placeholder="Birthday"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-whose`}>Whose date</Label>
          <Select value={whoseChoice} onValueChange={setWhoseChoice}>
            <SelectTrigger id={`${idPrefix}-whose`} className="h-11">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SELF}>The client</SelectItem>
              {householdNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
              <SelectItem value={OTHER}>Someone else…</SelectItem>
            </SelectContent>
          </Select>
          {whoseChoice === OTHER && (
            <Input
              aria-label="Name of the person"
              value={whoseOther}
              onChange={(e) => setWhoseOther(e.target.value)}
              placeholder="Name"
              className="mt-2 h-11"
            />
          )}
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-date`}>Date</Label>
          <Input
            id={`${idPrefix}-date`}
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="h-11"
            required
          />
          {recurs && (
            <div className="flex min-h-[44px] items-center gap-2">
              <Checkbox
                id={`${idPrefix}-year-unknown`}
                checked={yearUnknown}
                onCheckedChange={(v) => setYearUnknown(v === true)}
              />
              <Label htmlFor={`${idPrefix}-year-unknown`} className="font-normal">
                I don&apos;t know the year
              </Label>
            </div>
          )}
        </div>

        <div className="flex min-h-[44px] items-center justify-between gap-3 sm:col-span-1">
          <Label htmlFor={`${idPrefix}-recurs`}>Repeats every year</Label>
          <Switch id={`${idPrefix}-recurs`} checked={recurs} onCheckedChange={setRecurs} />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${idPrefix}-remind`}>Remind me (days before)</Label>
          <Input
            id={`${idPrefix}-remind`}
            type="number"
            inputMode="numeric"
            min={0}
            max={90}
            value={remindDays}
            onChange={(e) => setRemindDays(e.target.value)}
            className="h-11"
          />
        </div>

        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor={`${idPrefix}-notes`}>Notes</Label>
          <Textarea
            id={`${idPrefix}-notes`}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Loves horses — card and a tack-shop gift card"
          />
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-destructive">
          {error}
        </p>
      )}

      <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <Button type="button" variant="outline" onClick={onDone} disabled={saving}>
          Cancel
        </Button>
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving…' : keyDate ? 'Save date' : 'Add date'}
        </Button>
      </div>
    </form>
  );
}
