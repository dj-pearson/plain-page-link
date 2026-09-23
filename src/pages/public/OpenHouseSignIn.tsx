/**
 * The open house sign-in kiosk: `/open-house/:openHouseId`.
 *
 * Runs on a tablet propped by the front door. Each visitor fills in the form,
 * sees a thank-you, and the page clears itself for the next person — nobody
 * should ever see the previous visitor's email address. The sign-in goes
 * through submit-lead (see submitOpenHouseSignIn), so it lands in the agent's
 * Leads with the open house attached.
 *
 * Only the public columns reach this page: get_public_open_house returns no
 * private notes, and null for an open house that is not taking sign-ins.
 */
import { useCallback, useEffect, useRef, useState, type FormEvent } from 'react';
import { Link, useParams } from 'react-router-dom';
import { format } from 'date-fns';
import { z } from 'zod';
import { Bath, BedDouble, CalendarClock, CheckCircle2, Loader2, Ruler } from 'lucide-react';
import { SEOHead } from '@/components/SEOHead';
import {
  formatOpenHouseAddress,
  submitOpenHouseSignIn,
  usePublicOpenHouse,
} from '@/hooks/useOpenHouses';
import { EdgeFunctionError } from '@/lib/edgeFunctions';
import { getImageUrl, PLACEHOLDER_PROPERTY_IMAGE } from '@/lib/images';
import { formatNumber, formatPrice, getInitials, parsePrice } from '@/lib/format';
import { toStringList } from '@/types/profile';
import { cn } from '@/lib/utils';

/** How long the thank-you stays up before the form clears for the next visitor. */
const KIOSK_RESET_MS = 8000;

const TIMELINE_OPTIONS = ['0-3 months', '3-6 months', '6-12 months', 'Just looking'] as const;
const HEARD_FROM_OPTIONS = [
  'Sign',
  'Online listing',
  'Social media',
  'Friend/neighbor',
  'Other',
] as const;

type YesNo = 'yes' | 'no';
type Preapproval = 'yes' | 'no' | 'not_yet';

interface KioskOpenHouse {
  id: string;
  agentId: string;
  startsAt: string;
  endsAt: string;
  publicNotes: string | null;
  address: string;
  city: string;
  state: string | null;
  zipCode: string | null;
  price: string | null;
  beds: number | null;
  baths: number | null;
  sqft: number | null;
  photo: string;
  agentUsername: string | null;
  agentName: string | null;
  agentAvatar: string | null;
  agentTitle: string | null;
  agentBrokerage: string | null;
}

const str = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v : null);
const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);

/** The RPC row, read defensively: it is a SQL function's result set, not a table. */
function toKioskOpenHouse(row: Record<string, unknown>): KioskOpenHouse | null {
  const id = str(row.id);
  const agentId = str(row.user_id);
  const startsAt = str(row.starts_at);
  const endsAt = str(row.ends_at);
  const address = str(row.address);
  if (!id || !agentId || !startsAt || !endsAt || !address) return null;
  const photos = toStringList(row.photos);
  return {
    id,
    agentId,
    startsAt,
    endsAt,
    publicNotes: str(row.public_notes),
    address,
    city: str(row.city) ?? '',
    state: str(row.state),
    zipCode: str(row.zip_code),
    price: str(row.price),
    beds: num(row.beds),
    baths: num(row.baths),
    sqft: num(row.sqft),
    photo: getImageUrl(photos[0] ?? str(row.image)),
    agentUsername: str(row.agent_username),
    agentName: str(row.agent_full_name),
    agentAvatar: str(row.agent_avatar_url),
    agentTitle: str(row.agent_title),
    agentBrokerage: str(row.agent_brokerage_name),
  };
}

function displayPrice(price: string | null): string | null {
  if (!price) return null;
  const n = parsePrice(price);
  return n > 0 ? formatPrice(n) : price;
}

function formatWindow(startsAt: string, endsAt: string): string {
  const s = new Date(startsAt);
  const e = new Date(endsAt);
  const time =
    format(s, 'a') === format(e, 'a')
      ? `${format(s, 'h:mm')}–${format(e, 'h:mm a')}`
      : `${format(s, 'h:mm a')}–${format(e, 'h:mm a')}`;
  return `${format(s, 'EEEE, MMMM d')} · ${time}`;
}

const signInSchema = z.object({
  name: z.string().trim().min(1, 'Please enter your name').max(100, 'That name is too long'),
  email: z.string().trim().email('Please enter a valid email address'),
  phone: z.string().trim().max(30, 'That phone number is too long'),
});

type FieldErrors = Partial<Record<'name' | 'email' | 'phone', string>>;

interface FormState {
  name: string;
  email: string;
  phone: string;
  hasAgent: YesNo | null;
  preapproval: Preapproval | null;
  timeline: string;
  heardFrom: string;
}

const EMPTY_FORM: FormState = {
  name: '',
  email: '',
  phone: '',
  hasAgent: null,
  preapproval: null,
  timeline: '',
  heardFrom: '',
};

function friendlyError(error: unknown): string {
  if (error instanceof EdgeFunctionError && error.status === 429) {
    return 'Please wait a moment and try again.';
  }
  if (error instanceof Error && /rate|too many/i.test(error.message)) {
    return 'Please wait a moment and try again.';
  }
  return "Sorry, we couldn't sign you in just now. Please try again, or let the agent know.";
}

interface ChoiceGroupProps<T extends string> {
  label: string;
  value: T | null;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}

function ChoiceGroup<T extends string>({ label, value, options, onChange }: ChoiceGroupProps<T>) {
  return (
    <fieldset>
      <legend className="mb-2 text-base font-medium text-foreground">{label}</legend>
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const selected = value === option.value;
          return (
            <button
              key={option.value}
              type="button"
              aria-pressed={selected}
              onClick={() => onChange(option.value)}
              className={cn(
                'min-h-[52px] min-w-[96px] flex-1 rounded-xl border px-4 text-base font-medium transition-colors',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
                selected
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-input bg-background text-foreground hover:bg-muted'
              )}
            >
              {option.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

const inputClass =
  'block w-full min-h-[52px] rounded-xl border border-input bg-background px-4 text-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring';

export default function OpenHouseSignIn() {
  const { openHouseId } = useParams<{ openHouseId: string }>();
  const { data, isLoading, isError } = usePublicOpenHouse(openHouseId);
  const openHouse = data ? toKioskOpenHouse(data) : null;

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [submittedName, setSubmittedName] = useState<string | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const reset = useCallback(() => {
    setForm(EMPTY_FORM);
    setErrors({});
    setSubmitError(null);
    setSubmittedName(null);
  }, []);

  // Kiosk: the thank-you clears itself so the next visitor starts blank.
  useEffect(() => {
    if (submittedName === null) return;
    const timer = setTimeout(reset, KIOSK_RESET_MS);
    return () => clearTimeout(timer);
  }, [submittedName, reset]);

  useEffect(() => {
    if (submittedName === null) nameRef.current?.focus();
  }, [submittedName]);

  const update = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!openHouse || submitting) return;

    const parsed = signInSchema.safeParse({
      name: form.name,
      email: form.email,
      phone: form.phone,
    });
    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0] as keyof FieldErrors;
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      return;
    }
    setErrors({});
    setSubmitError(null);
    setSubmitting(true);
    try {
      await submitOpenHouseSignIn({
        agentId: openHouse.agentId,
        openHouseId: openHouse.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone || undefined,
        hasAgent: form.hasAgent === null ? undefined : form.hasAgent === 'yes',
        preapproved: form.preapproval === null ? undefined : form.preapproval === 'yes',
        timeline: form.timeline || undefined,
        heardFrom: form.heardFrom || undefined,
      });
      setSubmittedName(parsed.data.name.split(/\s+/)[0] ?? parsed.data.name);
    } catch (error) {
      setSubmitError(friendlyError(error));
    } finally {
      setSubmitting(false);
    }
  };

  const seo = (
    <SEOHead
      title="Open house sign-in"
      description="Sign in to this open house."
      noindex
      nofollow
    />
  );

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background text-foreground">
        {seo}
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">Loading open house</span>
      </main>
    );
  }

  if (isError || !openHouse) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        {seo}
        <div className="max-w-md text-center">
          <h1 className="text-2xl font-semibold">This open house isn’t taking sign-ins</h1>
          <p className="mt-3 text-muted-foreground">
            It may have ended, been cancelled, or the link may be mistyped. If you’re at the door,
            please let the agent know.
          </p>
          <Link
            to="/"
            className="mt-6 inline-flex min-h-[44px] items-center rounded-xl bg-primary px-5 font-medium text-primary-foreground hover:bg-primary/90"
          >
            Go to the home page
          </Link>
        </div>
      </main>
    );
  }

  const agentName = openHouse.agentName ?? 'the listing agent';
  const price = displayPrice(openHouse.price);
  const fullAddress = formatOpenHouseAddress({
    address: openHouse.address,
    city: openHouse.city,
    state: openHouse.state,
    zip_code: openHouse.zipCode,
  });
  const cityLine = [openHouse.city, [openHouse.state, openHouse.zipCode].filter(Boolean).join(' ')]
    .filter(Boolean)
    .join(', ');
  const agentSubtitle = [openHouse.agentTitle, openHouse.agentBrokerage]
    .filter(Boolean)
    .join(' · ');

  return (
    <main className="min-h-screen bg-background text-foreground lg:grid lg:grid-cols-[minmax(0,5fr)_minmax(0,6fr)]">
      {seo}

      {/* The home */}
      <section aria-label="About this home" className="bg-muted/40 lg:min-h-screen">
        <img
          src={openHouse.photo}
          alt={`Front of ${fullAddress}`}
          className="h-56 w-full object-cover sm:h-72 lg:h-[45vh]"
          onError={(e) => {
            if (!e.currentTarget.src.endsWith(PLACEHOLDER_PROPERTY_IMAGE)) {
              e.currentTarget.src = PLACEHOLDER_PROPERTY_IMAGE;
            }
          }}
        />
        <div className="space-y-5 px-6 py-6 sm:px-10 lg:py-8">
          <div>
            <p className="text-base font-medium text-muted-foreground">Open house</p>
            <h2 className="mt-1 text-2xl font-semibold leading-tight sm:text-3xl">
              {openHouse.address}
            </h2>
            {cityLine && <p className="mt-1 text-lg text-muted-foreground">{cityLine}</p>}
          </div>

          {(price || openHouse.beds !== null || openHouse.baths !== null || openHouse.sqft) && (
            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-base">
              {price && <span className="text-xl font-semibold">{price}</span>}
              {openHouse.beds !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <BedDouble className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  {openHouse.beds} bd
                </span>
              )}
              {openHouse.baths !== null && (
                <span className="inline-flex items-center gap-1.5">
                  <Bath className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  {openHouse.baths} ba
                </span>
              )}
              {openHouse.sqft ? (
                <span className="inline-flex items-center gap-1.5">
                  <Ruler className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
                  {formatNumber(openHouse.sqft)} sqft
                </span>
              ) : null}
            </div>
          )}

          <p className="inline-flex items-center gap-2 text-base">
            <CalendarClock className="h-5 w-5 text-muted-foreground" aria-hidden="true" />
            {formatWindow(openHouse.startsAt, openHouse.endsAt)}
          </p>

          {openHouse.publicNotes && (
            <p className="max-w-prose whitespace-pre-line text-base text-muted-foreground">
              {openHouse.publicNotes}
            </p>
          )}

          <div className="flex items-center gap-4 border-t border-border pt-5">
            {openHouse.agentAvatar ? (
              <img
                src={openHouse.agentAvatar}
                alt=""
                className="h-14 w-14 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                aria-hidden="true"
                className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground"
              >
                {getInitials(openHouse.agentName ?? 'Agent')}
              </span>
            )}
            <div className="min-w-0">
              <p className="text-lg font-semibold">{openHouse.agentName ?? 'Your host'}</p>
              {agentSubtitle && <p className="text-muted-foreground">{agentSubtitle}</p>}
            </div>
          </div>
        </div>
      </section>

      {/* The sign-in */}
      <section
        aria-label="Sign in"
        className="flex items-start justify-center px-6 py-8 sm:px-10 lg:items-center lg:py-12"
      >
        {submittedName !== null ? (
          <div className="w-full max-w-xl py-12 text-center" role="status" aria-live="polite">
            <CheckCircle2 className="mx-auto h-16 w-16 text-primary" aria-hidden="true" />
            <h1 className="mt-6 text-3xl font-semibold">Thanks for visiting, {submittedName}!</h1>
            <p className="mt-3 text-lg text-muted-foreground">
              You’re signed in. Enjoy the tour — {agentName} will follow up with details.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-8 inline-flex min-h-[56px] items-center justify-center rounded-xl bg-primary px-8 text-lg font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Next visitor
            </button>
            <p className="mt-4 text-sm text-muted-foreground">
              This screen clears on its own in a few seconds.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} noValidate className="w-full max-w-xl space-y-6">
            <div>
              <h1 className="text-3xl font-semibold">Welcome! Please sign in</h1>
              <p className="mt-2 text-lg text-muted-foreground">It takes about 30 seconds.</p>
            </div>

            <div>
              <label htmlFor="oh-name" className="mb-2 block text-base font-medium">
                Name <span className="text-muted-foreground">(required)</span>
              </label>
              <input
                id="oh-name"
                ref={nameRef}
                className={inputClass}
                autoComplete="off"
                value={form.name}
                onChange={(e) => update('name', e.target.value)}
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? 'oh-name-error' : undefined}
              />
              {errors.name && (
                <p id="oh-name-error" className="mt-1.5 text-sm text-destructive">
                  {errors.name}
                </p>
              )}
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="oh-email" className="mb-2 block text-base font-medium">
                  Email <span className="text-muted-foreground">(required)</span>
                </label>
                <input
                  id="oh-email"
                  type="email"
                  inputMode="email"
                  autoComplete="off"
                  autoCapitalize="none"
                  className={inputClass}
                  value={form.email}
                  onChange={(e) => update('email', e.target.value)}
                  aria-invalid={!!errors.email}
                  aria-describedby={errors.email ? 'oh-email-error' : undefined}
                />
                {errors.email && (
                  <p id="oh-email-error" className="mt-1.5 text-sm text-destructive">
                    {errors.email}
                  </p>
                )}
              </div>
              <div>
                <label htmlFor="oh-phone" className="mb-2 block text-base font-medium">
                  Phone
                </label>
                <input
                  id="oh-phone"
                  type="tel"
                  inputMode="tel"
                  autoComplete="off"
                  className={inputClass}
                  value={form.phone}
                  onChange={(e) => update('phone', e.target.value)}
                  aria-invalid={!!errors.phone}
                  aria-describedby={errors.phone ? 'oh-phone-error' : undefined}
                />
                {errors.phone && (
                  <p id="oh-phone-error" className="mt-1.5 text-sm text-destructive">
                    {errors.phone}
                  </p>
                )}
              </div>
            </div>

            <ChoiceGroup<YesNo>
              label="Are you working with an agent?"
              value={form.hasAgent}
              onChange={(v) => update('hasAgent', v)}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
              ]}
            />

            <ChoiceGroup<Preapproval>
              label="Pre-approved or paying cash?"
              value={form.preapproval}
              onChange={(v) => update('preapproval', v)}
              options={[
                { value: 'yes', label: 'Yes' },
                { value: 'no', label: 'No' },
                { value: 'not_yet', label: 'Not yet' },
              ]}
            />

            <div className="grid gap-6 sm:grid-cols-2">
              <div>
                <label htmlFor="oh-timeline" className="mb-2 block text-base font-medium">
                  When are you hoping to move?
                </label>
                <select
                  id="oh-timeline"
                  className={inputClass}
                  value={form.timeline}
                  onChange={(e) => update('timeline', e.target.value)}
                >
                  <option value="">Choose one</option>
                  {TIMELINE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="oh-heard" className="mb-2 block text-base font-medium">
                  How did you hear about it?
                </label>
                <select
                  id="oh-heard"
                  className={inputClass}
                  value={form.heardFrom}
                  onChange={(e) => update('heardFrom', e.target.value)}
                >
                  <option value="">Choose one</option>
                  {HEARD_FROM_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {submitError && (
              <p
                role="alert"
                className="rounded-xl bg-destructive/10 px-4 py-3 text-base text-destructive"
              >
                {submitError}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex min-h-[60px] w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 text-lg font-semibold text-primary-foreground hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-60"
            >
              {submitting && <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />}
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-sm text-muted-foreground">
              By signing in you agree that {agentName} may contact you about this and similar homes.
            </p>
          </form>
        )}
      </section>
    </main>
  );
}
